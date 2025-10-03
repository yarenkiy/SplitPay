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
    const { amount, description, paid_by, participants, custom_amounts, split_type } = req.body;
    const userId = req.user.id;

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
        'INSERT INTO expenses (group_id, user_id, paid_by, amount, description) VALUES (?, ?, ?, ?, ?)',
        [groupId, memberId, paidById, memberAmount, description || null]
      );
    }

    // If payer is NOT among participants, create a separate record for them
    if (!payerIsParticipant) {
      await pool.query(
        'INSERT INTO expenses (group_id, user_id, paid_by, amount, description) VALUES (?, ?, ?, ?, ?)',
        [groupId, paidById, paidById, -totalAmount, description || null]
      );
    }

    res.json({ message: 'Expense added successfully' });
  } catch (error) {
    console.error('addExpense error:', error);
    res.status(500).json({ message: 'Failed to add expense' });
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

// Get detailed group information
exports.getGroupDetails = async (req, res) => {
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
        u1.name as user_name,
        u2.name as paid_by_name
      FROM expenses e
      JOIN users u1 ON e.user_id = u1.id
      JOIN users u2 ON e.paid_by = u2.id
      WHERE e.group_id = ?
      ORDER BY e.created_at DESC`,
      [groupId]
    );

    // Calculate total income and expenses
    let totalIncome = 0;
    let totalExpenses = 0;

    expensesResult.rows.forEach(exp => {
      const amount = parseFloat(exp.amount);
      if (amount < 0) {
        totalIncome += Math.abs(amount);
      } else {
        totalExpenses += amount;
      }
    });

    // Create balance matrix (who owes whom)
    const balanceMatrix = [];
    const members = membersResult.rows;

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const member1 = members[i];
        const member2 = members[j];
        
        // Calculate net balance between two members
        const expensesBetween = expensesResult.rows.filter(exp => 
          (exp.user_id === member1.id && exp.paid_by === member2.id) ||
          (exp.user_id === member2.id && exp.paid_by === member1.id)
        );

        let netBalance = 0;
        expensesBetween.forEach(exp => {
          if (exp.paid_by === member1.id && exp.user_id === member2.id) {
            netBalance += parseFloat(exp.amount);
          } else if (exp.paid_by === member2.id && exp.user_id === member1.id) {
            netBalance -= parseFloat(exp.amount);
          }
        });

        if (Math.abs(netBalance) > 0.01) {
          balanceMatrix.push({
            from: netBalance > 0 ? member2.name : member1.name,
            to: netBalance > 0 ? member1.name : member2.name,
            amount: Math.abs(netBalance)
          });
        }
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
          expenseCount: expensesResult.rows.length
        },
        balances: balanceMatrix,
        recentExpenses: expensesResult.rows.slice(0, 10).map(exp => ({
          id: exp.id,
          description: exp.description,
          amount: parseFloat(exp.amount),
          userName: exp.user_name,
          paidByName: exp.paid_by_name,
          createdAt: exp.created_at
        }))
      }
    });
  } catch (error) {
    console.error('getGroupDetails error:', error);
    res.status(500).json({ message: 'Failed to fetch group details' });
  }
};
