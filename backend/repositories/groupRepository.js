const pool = require('../models/db');

class GroupRepository {
  async findGroupByInviteCode(inviteCode) {
    const { rows } = await pool.query(
      'SELECT id FROM `groups` WHERE invite_code = ?',
      [inviteCode]
    );
    return rows.length > 0;
  }

  async createGroup(name, description, color, inviteCode, userId) {
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

    return resolvedGroupId;
  }

  async addGroupMember(groupId, userId) {
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, userId]);
  }

  async getGroupMembers(groupId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ?
       ORDER BY u.name ASC`,
      [groupId]
    );
    return rows;
  }

  async findGroupById(groupId) {
    const { rows } = await pool.query(
      'SELECT id, name, description, color, invite_code, created_at FROM `groups` WHERE id = ?',
      [groupId]
    );
    return rows[0] || null;
  }

  async checkMembership(groupId, userId) {
    const { rows } = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return rows.length > 0;
  }

  async deleteExpenses(groupId) {
    await pool.query('DELETE FROM expenses WHERE group_id = ?', [groupId]);
  }

  async deleteGroupMembers(groupId) {
    await pool.query('DELETE FROM group_members WHERE group_id = ?', [groupId]);
  }

  async deleteGroup(groupId) {
    await pool.query('DELETE FROM `groups` WHERE id = ?', [groupId]);
  }

  async searchUsers(query) {
    const like = `%${query}%`;
    const { rows } = await pool.query(
      `SELECT id, name, email FROM users 
       WHERE name LIKE ? OR email LIKE ?
       ORDER BY name ASC
       LIMIT 20`,
      [like, like]
    );
    return rows;
  }

  async findGroupByInviteCodeFull(inviteCode) {
    const { rows } = await pool.query(
      'SELECT id, name, color FROM `groups` WHERE invite_code = ?',
      [inviteCode.toUpperCase()]
    );
    return rows[0] || null;
  }

  async addExpense(groupId, memberId, paidById, memberAmount, description, currency, currencySymbol, participantsCount) {
    await pool.query(
      'INSERT INTO expenses (group_id, user_id, paid_by, amount, description, currency, currency_symbol, participants_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [groupId, memberId, paidById, memberAmount, description || null, currency, currencySymbol, participantsCount]
    );
  }

  async getExpenseById(expenseId) {
    const { rows } = await pool.query(
      'SELECT e.*, g.id as group_id FROM expenses e JOIN `groups` g ON e.group_id = g.id WHERE e.id = ?',
      [expenseId]
    );
    return rows[0] || null;
  }

  async deleteExpenseTransaction(description, paidBy, createdAt, currency, groupId) {
    const result = await pool.query(
      `DELETE FROM expenses 
       WHERE description = ? 
         AND paid_by = ? 
         AND created_at = ? 
         AND currency = ?
         AND group_id = ?`,
      [description, paidBy, createdAt, currency, groupId]
    );
    return result.affectedRows;
  }

  async getGroupDetails(groupId) {
    // Get group info
    const groupResult = await pool.query(
      'SELECT id, name, description, color, invite_code, created_at FROM `groups` WHERE id = ?',
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return null;
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

    const members = membersResult.rows;

    // Get all expenses for this group
    const expensesResult = await pool.query(
      `SELECT 
        e.id,
        e.amount,
        e.description,
        e.created_at,
        e.user_id,
        e.paid_by,
        e.participants_count,
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

    // Get unique recent expenses for display
    const recentExpensesResult = await pool.query(
      `SELECT 
        MIN(e.id) as id,
        e.description,
        ABS(SUM(CASE WHEN e.amount < 0 THEN e.amount ELSE 0 END)) as amount,
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

    return {
      group,
      members,
      expenses: expensesResult.rows,
      recentExpenses: recentExpensesResult.rows
    };
  }

  async getAllExpenseGroups() {
    const { rows } = await pool.query(`
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
    return rows;
  }

  async updateParticipantsCount(participantCount, description, paidBy, createdAt, currency) {
    const result = await pool.query(`
      UPDATE expenses 
      SET participants_count = ?
      WHERE description = ? 
        AND paid_by = ? 
        AND created_at = ? 
        AND currency = ?
    `, [participantCount, description, paidBy, createdAt, currency]);
    return result.affectedRows;
  }
}

module.exports = new GroupRepository();

