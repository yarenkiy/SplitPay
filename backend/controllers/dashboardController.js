const dashboardService = require('../services/dashboardService');

// Get complete dashboard data
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await dashboardService.getDashboardData(userId);
    res.json(result);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};

// Get summary data only
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await dashboardService.getSummary(userId);
    res.json(result);
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
};

// Get user groups
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await dashboardService.getUserGroups(userId);
    res.json(result);
  } catch (error) {
    console.error('Groups error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await dashboardService.getRecentActivities(userId);
    res.json(result);
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
};

module.exports = {
  getDashboardData,
  getSummary,
  getRecentActivities,
  getUserGroups
};
