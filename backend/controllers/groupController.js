const pool = require('../models/db');

// Create a new group and add creator as a member
exports.createGroup = async (req, res) => {
  try {
    const { name, description, color, members } = req.body;
    const userId = req.user.id;

    // Insert into groups table
    const groupInsert = await pool.query(
      'INSERT INTO `groups` (name, description, color, created_by) VALUES (?, ?, ?, ?)',
      [name, description || null, color || '#6366F1', userId]
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

    res.json({ id: resolvedGroupId, name, description: description || null, color: color || '#6366F1' });
  } catch (error) {
    console.error('createGroup error:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
};

// Add expense and split among group members
exports.addExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount, description, paid_by } = req.body;
    const userId = req.user.id;

    // Basic validation
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Get all group members
    const membersResult = await pool.query(
      'SELECT user_id FROM group_members WHERE group_id = ?',
      [groupId]
    );
    
    const members = membersResult.rows;
    const memberCount = members.length;
    
    if (memberCount === 0) {
      return res.status(400).json({ message: 'No members in group' });
    }

    // Calculate split amount per person
    const splitAmount = parseFloat(amount) / memberCount;
    const paidById = paid_by || userId;

    // Create expense records for each member
    for (const member of members) {
      const memberId = member.user_id;
      
      // If this member paid, they get negative (credit/alacak)
      // If this member didn't pay, they get positive (debt/borç)
      const memberAmount = memberId === paidById 
        ? -(parseFloat(amount) - splitAmount)  // Paid amount minus their share = credit
        : splitAmount;  // Just their share = debt

      await pool.query(
        'INSERT INTO expenses (group_id, user_id, paid_by, amount, description) VALUES (?, ?, ?, ?, ?)',
        [groupId, memberId, paidById, memberAmount, description || null]
      );
    }

    res.json({ message: 'Expense added and split among members' });
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
