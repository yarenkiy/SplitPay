const pool = require('../models/db');

// Get complete dashboard data
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get summary data
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_debt,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_credit,
        COALESCE(SUM(amount), 0) as balance
      FROM expenses 
      WHERE user_id = $1
    `;
    
    const summaryResult = await pool.query(summaryQuery, [userId]);
    const summary = summaryResult.rows[0];
    
    // Get user groups
    const groupsQuery = `
      SELECT 
        g.id,
        g.name,
        g.color,
        COUNT(DISTINCT gm.user_id) as member_count,
        COALESCE(SUM(e.amount), 0) as user_balance
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN expenses e ON g.id = e.group_id AND e.user_id = $1
      WHERE gm.user_id = $1
      GROUP BY g.id, g.name, g.color
      ORDER BY g.created_at DESC
    `;
    
    const groupsResult = await pool.query(groupsQuery, [userId]);
    
    // Get recent activities
    const activitiesQuery = `
      SELECT 
        e.id,
        e.description,
        e.amount,
        e.created_at,
        g.name as group_name,
        g.color as group_color,
        CASE 
          WHEN e.amount > 0 THEN 'debt'
          WHEN e.amount < 0 THEN 'payment'
          ELSE 'expense'
        END as activity_type
      FROM expenses e
      JOIN groups g ON e.group_id = g.id
      WHERE e.user_id = $1 OR e.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = $1
      )
      ORDER BY e.created_at DESC
      LIMIT 10
    `;
    
    const activitiesResult = await pool.query(activitiesQuery, [userId]);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalDebt: parseFloat(summary.total_debt),
          totalCredit: parseFloat(summary.total_credit),
          balance: parseFloat(summary.balance)
        },
        groups: groupsResult.rows.map(group => ({
          id: group.id,
          name: group.name,
          debt: parseFloat(group.user_balance),
          members: group.member_count,
          color: group.color
        })),
        activities: activitiesResult.rows.map(activity => ({
          id: activity.id,
          type: activity.activity_type,
          message: `${activity.description} - ₺${Math.abs(activity.amount)}`,
          group: activity.group_name,
          time: formatTimeAgo(activity.created_at),
          icon: getActivityIcon(activity.activity_type),
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
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_credit,
        COALESCE(SUM(amount), 0) as balance
      FROM expenses 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    const summary = result.rows[0];
    
    res.json({
      success: true,
      data: {
        totalDebt: parseFloat(summary.total_debt),
        totalCredit: parseFloat(summary.total_credit),
        balance: parseFloat(summary.balance)
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
        COUNT(DISTINCT gm.user_id) as member_count,
        COALESCE(SUM(e.amount), 0) as user_balance
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN expenses e ON g.id = e.group_id AND e.user_id = $1
      WHERE gm.user_id = $1
      GROUP BY g.id, g.name, g.color
      ORDER BY g.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows.map(group => ({
        id: group.id,
        name: group.name,
        debt: parseFloat(group.user_balance),
        members: group.member_count,
        color: group.color
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
        e.id,
        e.description,
        e.amount,
        e.created_at,
        g.name as group_name,
        g.color as group_color,
        CASE 
          WHEN e.amount > 0 THEN 'debt'
          WHEN e.amount < 0 THEN 'payment'
          ELSE 'expense'
        END as activity_type
      FROM expenses e
      JOIN groups g ON e.group_id = g.id
      WHERE e.user_id = $1 OR e.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = $1
      )
      ORDER BY e.created_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows.map(activity => ({
        id: activity.id,
        type: activity.activity_type,
        message: `${activity.description} - ₺${Math.abs(activity.amount)}`,
        group: activity.group_name,
        time: formatTimeAgo(activity.created_at),
        icon: getActivityIcon(activity.activity_type),
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
  const diffInHours = Math.floor((now - activityDate) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Az önce';
  if (diffInHours < 24) return `${diffInHours} saat önce`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} gün önce`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} hafta önce`;
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