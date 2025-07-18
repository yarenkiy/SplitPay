const express = require('express');
const router = express.Router();
const { getDashboardData, getSummary, getRecentActivities, getUserGroups } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/authMiddleware');

// All dashboard routes require authentication
router.use(authenticateToken);

router.get('/', getDashboardData);
router.get('/summary', getSummary);
router.get('/activities', getRecentActivities);
router.get('/groups', getUserGroups);

module.exports = router; 