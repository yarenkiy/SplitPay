const pool = require('../models/db');

class DashboardRepository {
  async getUserSummary(userId) {
    const { rows } = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_debt,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_credit
      FROM expenses 
      WHERE user_id = ?
    `, [userId]);
    return rows[0];
  }

  async getUserGroups(userId) {
    const { rows } = await pool.query(`
      SELECT 
        g.id,
        g.name,
        g.color,
        g.invite_code,
        g.created_at,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        COALESCE(SUM(e.amount), 0) as user_balance
      FROM \`groups\` g
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN expenses e ON g.id = e.group_id AND e.user_id = ?
      WHERE gm.user_id = ?
      GROUP BY g.id, g.name, g.color, g.invite_code, g.created_at
      ORDER BY g.created_at DESC
    `, [userId, userId]);
    return rows;
  }

  async getRecentActivities(userId) {
    const { rows } = await pool.query(`
      SELECT 
        MIN(e.id) as id,
        e.description,
        ABS(SUM(CASE WHEN e.amount < 0 THEN e.amount ELSE 0 END)) as negative_sum,
        SUM(CASE WHEN e.amount > 0 THEN e.amount ELSE 0 END) as positive_sum,
        e.currency,
        e.currency_symbol,
        e.created_at,
        e.paid_by,
        u.name as paid_by_name,
        g.name as group_name,
        g.color as group_color,
        COUNT(DISTINCT e.user_id) as participant_count
      FROM expenses e
      JOIN \`groups\` g ON e.group_id = g.id
      JOIN users u ON e.paid_by = u.id
      WHERE e.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = ?
      )
      GROUP BY e.description, e.paid_by, e.created_at, e.currency, e.currency_symbol, g.name, g.color, u.name
      ORDER BY e.created_at DESC
      LIMIT 6
    `, [userId]);
    return rows;
  }
}

module.exports = new DashboardRepository();

