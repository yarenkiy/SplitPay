const pool = require('../models/db');

// Get complete dashboard data
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get summary data
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_debt,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_credit
      FROM expenses 
      WHERE user_id = ?
    `;
    
    const summaryResult = await pool.query(summaryQuery, [userId]);
    const summary = summaryResult.rows[0];
    
    // Calculate balance: credit - debt (positive means you get money, negative means you owe)
    const balance = parseFloat(summary.total_credit) - parseFloat(summary.total_debt);
    
    // Get user groups
    const groupsQuery = `
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
    `;
    
    const groupsResult = await pool.query(groupsQuery, [userId, userId]);
    
    // Get recent activities - Show unique transactions (not duplicates)
    const activitiesQuery = `
      SELECT 
        MIN(e.id) as id,
        e.description,
        ABS(MIN(CASE WHEN e.amount < 0 THEN e.amount ELSE NULL END)) as total_amount,
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
    `;
    
    const activitiesResult = await pool.query(activitiesQuery, [userId]);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalDebt: parseFloat(summary.total_debt),
          totalCredit: parseFloat(summary.total_credit),
          balance: balance
        },
        groups: groupsResult.rows.map(group => ({
          id: group.id,
          name: group.name,
          debt: parseFloat(group.user_balance),
          members: parseInt(group.member_count),
          color: group.color,
          inviteCode: group.invite_code
        })),
        activities: activitiesResult.rows.map(activity => ({
          id: activity.id,
          type: 'expense',
          message: `${activity.description} - ${activity.currency_symbol || '₺'}${activity.total_amount || 0}`,
          detail: `Paid by ${activity.paid_by_name}`,
          participants: activity.participant_count,
          group: activity.group_name,
          time: formatTimeAgo(activity.created_at),
          icon: 'receipt-outline',
          color: activity.group_color
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};

// Get summary data only
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_debt,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_credit
      FROM expenses 
      WHERE user_id = ?
    `;
    
    const result = await pool.query(query, [userId]);
    const summary = result.rows[0];
    
    // Calculate balance: credit - debt
    const balance = parseFloat(summary.total_credit) - parseFloat(summary.total_debt);
    
    res.json({
      success: true,
      data: {
        totalDebt: parseFloat(summary.total_debt),
        totalCredit: parseFloat(summary.total_credit),
        balance: balance
      }
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
};

// Get user groups
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
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
    `;
    
    const result = await pool.query(query, [userId, userId]);
    
    res.json({
      success: true,
      data: result.rows.map(group => ({
        id: group.id,
        name: group.name,
        debt: parseFloat(group.user_balance),
        members: parseInt(group.member_count),
        color: group.color,
        inviteCode: group.invite_code
      }))
    });
  } catch (error) {
    console.error('Groups error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        MIN(e.id) as id,
        e.description,
        ABS(MIN(CASE WHEN e.amount < 0 THEN e.amount ELSE NULL END)) as total_amount,
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
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows.map(activity => ({
        id: activity.id,
        type: 'expense',
        message: `${activity.description} - ${activity.currency_symbol || '₺'}${activity.total_amount || 0}`,
        detail: `Paid by ${activity.paid_by_name}`,
        participants: activity.participant_count,
        group: activity.group_name,
        time: formatTimeAgo(activity.created_at),
        icon: 'receipt-outline',
        color: activity.group_color
      }))
    });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
};

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
};

// Helper function to get activity icon
const getActivityIcon = (type) => {
  switch (type) {
    case 'debt': return 'arrow-down';
    case 'payment': return 'checkmark-circle';
    case 'expense': return 'add-circle';
    default: return 'information-circle';
  }
};

module.exports = {
  getDashboardData,
  getSummary,
  getRecentActivities,
  getUserGroups
}; 