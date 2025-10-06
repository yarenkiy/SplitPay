const pool = require('../models/db');

// Generate random 6-character alphanumeric code
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new group and add creator as a member
exports.createGroup = async (req, res) => {
  try {
    const { name, description, color, members } = req.body;
    const userId = req.user.id;

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const checkResult = await pool.query(
        'SELECT id FROM `groups` WHERE invite_code = ?',
        [inviteCode]
      );
      isUnique = checkResult.rows.length === 0;
    }

    // Insert into groups table
    const groupInsert = await pool.query(
      'INSERT INTO `groups` (name, description, color, invite_code, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, color || '#6366F1', inviteCode, userId]
    );

    const groupId = groupInsert.rows.insertId || groupInsert.rows[0]?.id;

    // Ensure groupId resolved for both mysql2 return shapes
    const resolvedGroupId = groupId || (() => {
      const last = Array.isArray(groupInsert.rows) ? groupInsert.rows[groupInsert.rows.length - 1] : null;
      return last?.id;
    })();

    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [resolvedGroupId, userId]);

    // Optionally add additional members (excluding creator), deduplicated
    if (Array.isArray(members) && members.length > 0) {
      const uniqueMemberIds = [...new Set(members.map((m) => Number(m)).filter((id) => id && id !== Number(userId)))];
      for (const memberId of uniqueMemberIds) {
        try {
          await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [resolvedGroupId, memberId]);
        } catch (e) {
          // ignore duplicates or FK errors silently for now
        }
      }
    }

    res.json({ 
      id: resolvedGroupId, 
      name, 
      description: description || null, 
      color: color || '#6366F1',
      invite_code: inviteCode 
    });
  } catch (error) {
    console.error('createGroup error:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
};

// Add expense and split among group members
exports.addExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount, description, paid_by, participants, custom_amounts, split_type, currency, currency_symbol } = req.body;
    const userId = req.user.id;
    
    const expenseCurrency = currency || 'TRY';
    const expenseCurrencySymbol = currency_symbol || '₺';

    // Basic validation
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const paidById = paid_by || userId;
    const totalAmount = parseFloat(amount);

    // Determine which members to split between
    let participantIds = participants;
    if (!participantIds || participantIds.length === 0) {
      // If no participants specified, use all group members
      const membersResult = await pool.query(
        'SELECT user_id FROM group_members WHERE group_id = ?',
        [groupId]
      );
      participantIds = membersResult.rows.map(m => m.user_id);
    }

    if (participantIds.length === 0) {
      return res.status(400).json({ message: 'No participants found' });
    }

    // Calculate amounts for each participant
    let memberAmounts = {};
    
    if (split_type === 'custom' && custom_amounts) {
      // Use custom amounts
      memberAmounts = custom_amounts;
    } else {
      // Equal split
      const splitAmount = totalAmount / participantIds.length;
      participantIds.forEach(id => {
        memberAmounts[id] = splitAmount;
      });
    }

    // Check if payer is among participants
    const payerIsParticipant = participantIds.some(id => parseInt(id) === paidById);
    const participantsCount = participantIds.length;

    // Create expense records for participants
    for (const participantId of participantIds) {
      const memberId = parseInt(participantId);
      const shareAmount = parseFloat(memberAmounts[memberId] || 0);
      
      if (shareAmount <= 0) continue;

      // If this member paid, they get negative (credit/alacak)
      // If this member didn't pay, they get positive (debt/borç)
      let memberAmount;
      
      if (memberId === paidById) {
        // Payer who is also participant: credit = paid amount - their share
        memberAmount = -(totalAmount - shareAmount);
      } else {
        // Others: debt = their share
        memberAmount = shareAmount;
      }

      await pool.query(
        'INSERT INTO expenses (group_id, user_id, paid_by, amount, description, currency, currency_symbol, participants_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [groupId, memberId, paidById, memberAmount, description || null, expenseCurrency, expenseCurrencySymbol, participantsCount]
      );
    }

    // If payer is NOT among participants, create a separate record for them
    if (!payerIsParticipant) {
      await pool.query(
        'INSERT INTO expenses (group_id, user_id, paid_by, amount, description, currency, currency_symbol, participants_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [groupId, paidById, paidById, -totalAmount, description || null, expenseCurrency, expenseCurrencySymbol, participantsCount]
      );
    }

    res.json({ message: 'Expense added successfully' });
  } catch (error) {
    console.error('addExpense error:', error);
    res.status(500).json({ message: 'Failed to add expense' });
  }
};

// Migration: Fix participants_count for existing expenses
exports.fixParticipantsCount = async (req, res) => {
  try {
    // Update all expenses to have correct participants_count based on actual expense records
    // First, let's find all unique expense transactions and count their participants
    const expenseGroups = await pool.query(`
      SELECT 
        description,
        paid_by,
        created_at,
        currency,
        COUNT(*) as participant_count
      FROM expenses 
      GROUP BY description, paid_by, created_at, currency
      HAVING COUNT(*) > 0
    `);
    
    console.log('Found expense groups:', expenseGroups.rows);
    
    let totalUpdated = 0;
    
    // Update each group of expenses with the correct participant count
    for (const group of expenseGroups.rows) {
      const result = await pool.query(`
        UPDATE expenses 
        SET participants_count = ?
        WHERE description = ? 
          AND paid_by = ? 
          AND created_at = ? 
          AND currency = ?
      `, [group.participant_count, group.description, group.paid_by, group.created_at, group.currency]);
      
      totalUpdated += result.affectedRows;
      console.log(`Updated ${result.affectedRows} expenses for ${group.description} to participants_count = ${group.participant_count}`);
    }
    
    res.json({ 
      message: 'Migration completed!',
      totalUpdated,
      groupsProcessed: expenseGroups.rows.length
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: 'Migration failed' });
  }
};

// Get members of a group
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ?
       ORDER BY u.name ASC`,
      [groupId]
    );
    res.json(members.rows);
  } catch (error) {
    console.error('getGroupMembers error:', error);
    res.status(500).json({ message: 'Failed to fetch group members' });
  }
};

// Search users by name or email (partial, case-insensitive)
exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }
    const like = `%${q}%`;
    const result = await pool.query(
      `SELECT id, name, email FROM users 
       WHERE name LIKE ? OR email LIKE ?
       ORDER BY name ASC
       LIMIT 20`,
      [like, like]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
};

// Join a group by invite code
exports.joinGroupByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode || inviteCode.length !== 6) {
      return res.status(400).json({ message: 'Invalid invite code' });
    }

    // Find group by invite code
    const groupResult = await pool.query(
      'SELECT id, name, color FROM `groups` WHERE invite_code = ?',
      [inviteCode.toUpperCase()]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found with this code' });
    }

    const group = groupResult.rows[0];

    // Check if user is already a member
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [group.id, userId]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add user to group
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [group.id, userId]
    );

    res.json({ 
      success: true,
      message: `Successfully joined ${group.name}!`,
      group: {
        id: group.id,
        name: group.name,
        color: group.color
      }
    });
  } catch (error) {
    console.error('joinGroupByCode error:', error);
    res.status(500).json({ message: 'Failed to join group' });
  }
};

// Delete a group (only creator or member can delete)
exports.deleteGroup = async (req, res) => {
  try {
    console.log('🗑️  DELETE GROUP REQUEST RECEIVED');
    console.log('Params:', req.params);
    console.log('User ID:', req.user?.id);
    
    const { groupId } = req.params;
    const userId = req.user.id;

    console.log(`Attempting to delete group ${groupId} by user ${userId}`);

    // Check if user is a member of the group
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    console.log('Member check result:', memberCheck.rows);

    if (memberCheck.rows.length === 0) {
      console.log('❌ User is not a member of this group');
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Delete all expenses related to the group
    console.log('Deleting expenses...');
    await pool.query('DELETE FROM expenses WHERE group_id = ?', [groupId]);

    // Delete all group members
    console.log('Deleting group members...');
    await pool.query('DELETE FROM group_members WHERE group_id = ?', [groupId]);

    // Delete the group
    console.log('Deleting group...');
    await pool.query('DELETE FROM `groups` WHERE id = ?', [groupId]);

    console.log('✅ Group deleted successfully');
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('❌ deleteGroup error:', error);
    res.status(500).json({ message: 'Failed to delete group' });
  }
};

// Delete an expense/activity (only the user who created it or group member can delete)
// Note: Deletes ALL related expense records (the entire transaction)
exports.deleteExpense = async (req, res) => {
  try {
    console.log('🗑️  DELETE EXPENSE REQUEST RECEIVED');
    console.log('Params:', req.params);
    console.log('User ID:', req.user?.id);
    
    const { expenseId } = req.params;
    const userId = req.user.id;

    console.log(`Attempting to delete expense ${expenseId} by user ${userId}`);

    // First, get the expense details to check permissions and get transaction info
    const expenseResult = await pool.query(
      'SELECT e.*, g.id as group_id FROM expenses e JOIN `groups` g ON e.group_id = g.id WHERE e.id = ?',
      [expenseId]
    );

    if (expenseResult.rows.length === 0) {
      console.log('❌ Expense not found');
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = expenseResult.rows[0];
    console.log('Expense found:', expense);

    // Check if user is a member of the group
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [expense.group_id, userId]
    );

    console.log('Member check result:', memberCheck.rows);

    if (memberCheck.rows.length === 0) {
      console.log('❌ User is not a member of this group');
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Delete ALL expenses with the same transaction (description, paid_by, created_at, currency)
    // This ensures we delete both positive and negative amounts
    console.log('Deleting expense transaction...');
    const deleteResult = await pool.query(
      `DELETE FROM expenses 
       WHERE description = ? 
         AND paid_by = ? 
         AND created_at = ? 
         AND currency = ?
         AND group_id = ?`,
      [expense.description, expense.paid_by, expense.created_at, expense.currency, expense.group_id]
    );

    console.log(`✅ Deleted ${deleteResult.affectedRows} expense records`);
    
    if (deleteResult.affectedRows === 0) {
      console.log('❌ No expense was deleted');
      return res.status(404).json({ message: 'Expense not found or already deleted' });
    }

    res.json({ 
      success: true, 
      message: 'Expense deleted successfully',
      deletedRecords: deleteResult.affectedRows
    });
  } catch (error) {
    console.error('❌ deleteExpense error:', error);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
};

// Get detailed group information
exports.getGroupDetails = async (req, res) => {
  console.log('🔵 getGroupDetails called - groupId:', req.params.groupId, 'userId:', req.user?.id);
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is a member
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Get group info
    const groupResult = await pool.query(
      'SELECT id, name, description, color, invite_code, created_at FROM `groups` WHERE id = ?',
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const group = groupResult.rows[0];

    // Get all members with their balances
    const membersResult = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        COALESCE(SUM(e.amount), 0) as balance
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      LEFT JOIN expenses e ON u.id = e.user_id AND e.group_id = ?
      WHERE gm.group_id = ?
      GROUP BY u.id, u.name, u.email
      ORDER BY u.name ASC`,
      [groupId, groupId]
    );

    // Get all expenses for this group
    const expensesResult = await pool.query(
      `SELECT 
        e.id,
        e.amount,
        e.description,
        e.created_at,
        e.user_id,
        e.paid_by,
        e.currency,
        e.currency_symbol,
        u1.name as user_name,
        u2.name as paid_by_name
      FROM expenses e
      JOIN users u1 ON e.user_id = u1.id
      JOIN users u2 ON e.paid_by = u2.id
      WHERE e.group_id = ?
      ORDER BY e.created_at DESC`,
      [groupId]
    );
    
    console.log('📊 Expenses found:', expensesResult.rows.length);
    console.log('Expenses data:', JSON.stringify(expensesResult.rows, null, 2));

    // Calculate my expenses and total expenses by currency
    const myExpensesByCurrency = {};
    const totalExpensesByCurrency = {};
    
    // Track unique expense transactions and calculate each member's share
    const uniqueExpenses = new Map();
    const memberShares = {}; // userId -> { currency -> share }

    expensesResult.rows.forEach(exp => {
      const amount = parseFloat(exp.amount);
      const currency = exp.currency || 'TRY';
      const symbol = exp.currency_symbol || '₺';
      const userId = exp.user_id;
      
      // Create unique key for each expense transaction
      const expenseKey = `${exp.description}-${exp.paid_by}-${exp.created_at}-${currency}`;
      
      // Track all amounts for each unique expense
      if (!uniqueExpenses.has(expenseKey)) {
        uniqueExpenses.set(expenseKey, {
          currency,
          symbol,
          participantsCount: exp.participants_count || 1,
          amounts: [],
          userAmounts: {} // userId -> amount
        });
      }
      const expense = uniqueExpenses.get(expenseKey);
      expense.amounts.push(amount);
      expense.userAmounts[userId] = amount;
    });
    
    // Calculate each member's real expense (their share) for each transaction
    console.log('=== Starting expense calculation ===');
    console.log('uniqueExpenses count:', uniqueExpenses.size);
    
    uniqueExpenses.forEach(expense => {
      const positiveAmounts = expense.amounts.filter(amt => amt > 0);
      const negativeAmounts = expense.amounts.filter(amt => amt < 0);
      
      console.log('Processing expense:', {
        amounts: expense.amounts,
        positiveAmounts,
        negativeAmounts,
        participantCount: expense.amounts.length
      });
      
      if (positiveAmounts.length > 0 && negativeAmounts.length > 0) {
        const totalDebt = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
        const totalCredit = negativeAmounts.reduce((sum, amt) => sum + Math.abs(amt), 0);
        
        // Calculate the actual number of participants from the expense records
        const actualParticipantsCount = expense.amounts.length;
        const avgShare = totalDebt / positiveAmounts.length;
        
        console.log('Calculation:', {
          totalDebt,
          totalCredit,
          avgShare,
          actualParticipantsCount
        });
        
        console.log(`→ SHARED expense (${actualParticipantsCount} participants)! Adding avgShare to everyone.`);
        
        // For each user in this expense, their share is avgShare
        Object.entries(expense.userAmounts).forEach(([uid, amount]) => {
          if (!memberShares[uid]) {
            memberShares[uid] = {};
          }
          if (!memberShares[uid][expense.currency]) {
            memberShares[uid][expense.currency] = { total: 0, symbol: expense.symbol };
          }
          
          memberShares[uid][expense.currency].total += avgShare;
          console.log(`  User ${uid}: +${avgShare} ${expense.currency}`);
        });
      }
    });

    console.log('=== Final memberShares ===');
    console.log(JSON.stringify(memberShares, null, 2));

    // Calculate logged-in user's expenses (My Expenses)
    if (memberShares[userId]) {
      Object.entries(memberShares[userId]).forEach(([currency, data]) => {
        myExpensesByCurrency[currency] = data;
      });
    }
    
    console.log('myExpensesByCurrency:', myExpensesByCurrency);
    
    // Calculate Total Expenses (sum of all members' shares)
    Object.values(memberShares).forEach(userCurrencies => {
      Object.entries(userCurrencies).forEach(([currency, data]) => {
        if (!totalExpensesByCurrency[currency]) {
          totalExpensesByCurrency[currency] = { total: 0, symbol: data.symbol };
        }
        totalExpensesByCurrency[currency].total += data.total;
      });
    });
    
    console.log('totalExpensesByCurrency:', totalExpensesByCurrency);

    // Use new names for backward compatibility
    const incomesByCurrency = myExpensesByCurrency;
    const expensesByCurrency = totalExpensesByCurrency;

    // Calculate totals for backward compatibility
    let totalIncome = 0;
    let totalExpenses = 0;
    Object.values(incomesByCurrency).forEach(curr => totalIncome += curr.total);
    Object.values(expensesByCurrency).forEach(curr => totalExpenses += curr.total);

    // Create balance matrix (who owes whom) by currency
    const balanceMatrix = [];
    const members = membersResult.rows;

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const member1 = members[i];
        const member2 = members[j];
        
        // Calculate net balance between two members for each currency
        const expensesBetween = expensesResult.rows.filter(exp => 
          (exp.user_id === member1.id && exp.paid_by === member2.id) ||
          (exp.user_id === member2.id && exp.paid_by === member1.id)
        );

        // Group by currency
        const balancesByCurrency = {};
        expensesBetween.forEach(exp => {
          const currency = exp.currency || 'TRY';
          const symbol = exp.currency_symbol || '₺';
          
          if (!balancesByCurrency[currency]) {
            balancesByCurrency[currency] = { balance: 0, symbol };
          }
          
          if (exp.paid_by === member1.id && exp.user_id === member2.id) {
            balancesByCurrency[currency].balance += parseFloat(exp.amount);
          } else if (exp.paid_by === member2.id && exp.user_id === member1.id) {
            balancesByCurrency[currency].balance -= parseFloat(exp.amount);
          }
        });

        // Create balance entries for each currency
        Object.entries(balancesByCurrency).forEach(([currency, data]) => {
          const netBalance = data.balance;
          if (Math.abs(netBalance) > 0.01) {
            balanceMatrix.push({
              from: netBalance > 0 ? member2.name : member1.name,
              to: netBalance > 0 ? member1.name : member2.name,
              amount: Math.abs(netBalance),
              currency: currency,
              currencySymbol: data.symbol
            });
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          color: group.color,
          inviteCode: group.invite_code,
          createdAt: group.created_at
        },
        members: members.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          balance: parseFloat(m.balance)
        })),
        summary: {
          totalIncome,
          totalExpenses,
          netBalance: totalIncome - totalExpenses,
          memberCount: members.length,
          expenseCount: expensesResult.rows.length,
          incomesByCurrency,
          expensesByCurrency
        },
        balances: balanceMatrix,
        recentExpenses: expensesResult.rows.slice(0, 10).map(exp => ({
          id: exp.id,
          description: exp.description,
          amount: parseFloat(exp.amount),
          userName: exp.user_name,
          paidByName: exp.paid_by_name,
          createdAt: exp.created_at,
          currency: exp.currency || 'TRY',
          currencySymbol: exp.currency_symbol || '₺'
        }))
      }
    });
  } catch (error) {
    console.error('getGroupDetails error:', error);
    res.status(500).json({ message: 'Failed to fetch group details' });
  }
};
