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

    // Check if this is a loan (only one participant and payer is not participant)
    const isLoan = split_type === 'loan' || (participantIds.length === 1 && !payerIsParticipant);

    if (isLoan) {
      // Loan: Only create negative record for the payer (lender)
      console.log('Creating LOAN expense:', description, 'Amount:', totalAmount);
      
      await pool.query(
        'INSERT INTO expenses (group_id, user_id, paid_by, amount, description, currency, currency_symbol, participants_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [groupId, paidById, paidById, -totalAmount, description || null, expenseCurrency, expenseCurrencySymbol, 1]
      );
    } else {
      // Shared expense: Create records for all participants
      console.log('Creating SHARED expense:', description, 'Amount:', totalAmount, 'Participants:', participantIds.length);
      
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

    // Convert members rows to array for later use
    const members = membersResult.rows;

    // Get all expenses for this group (for calculation)
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
    
    // Get unique recent expenses for display (no duplicates)
    const recentExpensesResult = await pool.query(
      `SELECT 
        MIN(e.id) as id,
        e.description,
        ABS(MIN(CASE WHEN e.amount < 0 THEN e.amount ELSE NULL END)) as amount,
        e.created_at,
        e.paid_by,
        e.currency,
        e.currency_symbol,
        u.name as paid_by_name,
        COUNT(DISTINCT e.user_id) as participant_count
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.group_id = ?
      GROUP BY e.description, e.paid_by, e.created_at, e.currency, e.currency_symbol, u.name
      ORDER BY e.created_at DESC
      LIMIT 10`,
      [groupId]
    );

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
      const uid = exp.user_id;
      
      // Create unique key for each expense transaction
      const expenseKey = `${exp.description}-${exp.paid_by}-${exp.created_at}-${currency}`;
      
      // Track all amounts for each unique expense
      if (!uniqueExpenses.has(expenseKey)) {
        uniqueExpenses.set(expenseKey, {
          currency,
          symbol,
          paidBy: exp.paid_by,
          amounts: [],
          userAmounts: {} // userId -> amount
        });
      }
      const expense = uniqueExpenses.get(expenseKey);
      expense.amounts.push(amount);
      expense.userAmounts[uid] = amount;
    });
    
    // Calculate each member's real expense (their share) for each transaction
    console.log('=== Starting expense calculation ===');
    console.log('uniqueExpenses count:', uniqueExpenses.size);
    
    uniqueExpenses.forEach((expense, key) => {
      const positiveAmounts = expense.amounts.filter(amt => amt > 0);
      const negativeAmounts = expense.amounts.filter(amt => amt < 0);
      const payerId = expense.paidBy;
      
      console.log('Processing expense:', key, {
        amounts: expense.amounts,
        positiveAmounts,
        negativeAmounts,
        participantCount: expense.amounts.length
      });
      
      // Loan case: only negative records present (payer recorded, but payees may be missing)
      if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
        const loanAmount = Math.abs(negativeAmounts[0]); // Loan amount
        console.log('→ LOAN detected (only negative amounts). Amount:', loanAmount);

        // Try to infer borrower(s): any group members who are NOT the payer
        const otherMembers = members.filter(m => Number(m.id) !== Number(payerId));

        if (otherMembers.length === 1) {
          const borrowerId = otherMembers[0].id;
          if (!memberShares[borrowerId]) memberShares[borrowerId] = {};
          if (!memberShares[borrowerId][expense.currency]) memberShares[borrowerId][expense.currency] = { total: 0, symbol: expense.symbol };
          memberShares[borrowerId][expense.currency].total += loanAmount;
          console.log(`  Assigned loan ${loanAmount} ${expense.currency} to user ${borrowerId}`);
        } else if (otherMembers.length > 1) {
          // Split loan among other members evenly
          const split = loanAmount / otherMembers.length;
          otherMembers.forEach(m => {
            if (!memberShares[m.id]) memberShares[m.id] = {};
            if (!memberShares[m.id][expense.currency]) memberShares[m.id][expense.currency] = { total: 0, symbol: expense.symbol };
            memberShares[m.id][expense.currency].total += split;
            console.log(`  Split loan ${split} ${expense.currency} to user ${m.id}`);
          });
        } else {
          // No other members found: try to find any positive userAmounts (fallback)
          Object.entries(expense.userAmounts).forEach(([uid, amount]) => {
            if (amount > 0) {
              if (!memberShares[uid]) memberShares[uid] = {};
              if (!memberShares[uid][expense.currency]) memberShares[uid][expense.currency] = { total: 0, symbol: expense.symbol };
              memberShares[uid][expense.currency].total += loanAmount;
              console.log(`  Fallback assigned loan ${loanAmount} ${expense.currency} to user ${uid}`);
            }
          });
        }
        return;
      }
      
      // Shared expense: both positive (debtors) and negative (payer) records exist
      if (positiveAmounts.length > 0 && negativeAmounts.length > 0) {
        // Correct total expense amount = sum of absolute values of ALL records in this transaction
        const totalPositive = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
        const totalNegativeAbs = negativeAmounts.reduce((sum, amt) => sum + Math.abs(amt), 0);
        const totalExpenseAmount = totalPositive + totalNegativeAbs;
        const totalParticipants = expense.amounts.length;
        const avgShare = totalExpenseAmount / totalParticipants;
        
        console.log('→ SHARED EXPENSE detected!', {
          totalPositive,
          totalNegativeAbs,
          totalExpenseAmount,
          totalParticipants,
          avgShare
        });
        
        Object.entries(expense.userAmounts).forEach(([uid, amount]) => {
          const numericUid = Number(uid);
          if (!memberShares[numericUid]) memberShares[numericUid] = {};
          if (!memberShares[numericUid][expense.currency]) memberShares[numericUid][expense.currency] = { total: 0, symbol: expense.symbol };
          memberShares[numericUid][expense.currency].total += avgShare;
          console.log(`  User ${uid} (amount: ${amount}): share = +${avgShare} ${expense.currency}`);
        });
      }
      
      // Only positive amounts (no payer record) - edge case: treat as shared among those with positive amounts
      if (positiveAmounts.length > 0 && negativeAmounts.length === 0) {
        console.log('⚠️  WARNING: Only positive amounts found (no payer record). Treating as shared expense.');
        const totalExpenseAmount = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
        const participantsCount = positiveAmounts.length;
        const avgShare = totalExpenseAmount / participantsCount;
        
        Object.entries(expense.userAmounts).forEach(([uid, amount]) => {
          if (amount > 0) {
            const numericUid = Number(uid);
            if (!memberShares[numericUid]) memberShares[numericUid] = {};
            if (!memberShares[numericUid][expense.currency]) memberShares[numericUid][expense.currency] = { total: 0, symbol: expense.symbol };
            memberShares[numericUid][expense.currency].total += avgShare;
            console.log(`  User ${uid}: share = +${avgShare} ${expense.currency}`);
          }
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

    // Create balance matrix (who owes whom) by currency using uniqueExpenses to avoid double-counting
    const balanceMatrix = [];

    // Build pairwise balances using uniqueExpenses so we use the original transaction grouping
    // key format: "fromId_toId_currency" -> { amount, symbol }
    const pairBalances = {};

    uniqueExpenses.forEach((expense) => {
      const currency = expense.currency || 'TRY';
      const symbol = expense.symbol || '₺';
      const paidBy = Number(expense.paidBy);

      const positiveAmounts = expense.amounts.filter(a => a > 0);
      const negativeAmounts = expense.amounts.filter(a => a < 0);

      // Loan case (only negative records): assign loan amount to OTHER members
      if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
        const loanAmount = Math.abs(negativeAmounts[0]);
        const otherMembers = members.filter(m => Number(m.id) !== paidBy);

        if (otherMembers.length === 1) {
          const borrowerId = otherMembers[0].id;
          const key = `${borrowerId}_${paidBy}_${currency}`;
          if (!pairBalances[key]) pairBalances[key] = { amount: 0, symbol };
          pairBalances[key].amount += loanAmount;
        } else if (otherMembers.length > 1) {
          const split = loanAmount / otherMembers.length;
          otherMembers.forEach(m => {
            const key = `${m.id}_${paidBy}_${currency}`;
            if (!pairBalances[key]) pairBalances[key] = { amount: 0, symbol };
            pairBalances[key].amount += split;
          });
        } else {
          // fallback: if we somehow have no other members, try positive userAmounts
          Object.entries(expense.userAmounts).forEach(([uid, amt]) => {
            if (amt > 0) {
              const key = `${uid}_${paidBy}_${currency}`;
              if (!pairBalances[key]) pairBalances[key] = { amount: 0, symbol };
              pairBalances[key].amount += loanAmount;
            }
          });
        }

        return; // done with this transaction
      }

      // Shared expense: take positive userAmounts as "they owe paidBy"
      Object.entries(expense.userAmounts).forEach(([uid, amt]) => {
        const numericUid = Number(uid);
        if (numericUid === paidBy) return; // skip payer
        const owed = parseFloat(amt) > 0 ? parseFloat(amt) : 0;
        if (owed <= 0) return;
        const key = `${numericUid}_${paidBy}_${currency}`;
        if (!pairBalances[key]) pairBalances[key] = { amount: 0, symbol };
        pairBalances[key].amount += owed;
      });
    });

    // Net pair balances (cancel out reverse directions) and build balanceMatrix
    const processed = new Set();
    Object.keys(pairBalances).forEach(key => {
      if (processed.has(key)) return;
      const [fromIdStr, toIdStr, currency] = key.split('_');
      const reverseKey = `${toIdStr}_${fromIdStr}_${currency}`;

      const forward = pairBalances[key]?.amount || 0;
      const reverse = pairBalances[reverseKey]?.amount || 0;
      const net = forward - reverse; // positive => fromId owes toId

      if (Math.abs(net) > 0.009) {
        const fromId = net > 0 ? fromIdStr : toIdStr;
        const toId = net > 0 ? toIdStr : fromIdStr;
        const amount = Math.round(Math.abs(net) * 100) / 100; // round to 2 decimals
        const symbol = pairBalances[key]?.symbol || pairBalances[reverseKey]?.symbol || '₺';
        const fromName = (members.find(m => String(m.id) === String(fromId)) || {}).name || `User ${fromId}`;
        const toName = (members.find(m => String(m.id) === String(toId)) || {}).name || `User ${toId}`;

        balanceMatrix.push({
          from: fromName,
          to: toName,
          amount,
          currency,
          currencySymbol: symbol
        });
      }

      processed.add(key);
      processed.add(reverseKey);
    });

    // Continue with response
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
        recentExpenses: recentExpensesResult.rows.map(exp => ({
          id: exp.id,
          description: exp.description,
          amount: parseFloat(exp.amount),
          paidByName: exp.paid_by_name,
          participants: exp.participant_count,
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
