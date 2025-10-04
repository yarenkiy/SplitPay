const express = require('express');
const router = express.Router();
const { createGroup, addExpense, getGroupMembers, searchUsers, joinGroupByCode, getGroupDetails, deleteGroup } = require('../controllers/groupController');
const authenticateToken = require('../middleware/authMiddleware');

// Static routes first (before parameterized routes)
router.post('/', authenticateToken, createGroup);
router.post('/join', authenticateToken, joinGroupByCode);
router.get('/search/users', authenticateToken, searchUsers);

// Parameterized routes after static routes
router.get('/:groupId/details', authenticateToken, getGroupDetails);
router.get('/:groupId/members', authenticateToken, getGroupMembers);
router.post('/:groupId/expenses', authenticateToken, addExpense);
router.delete('/:groupId', authenticateToken, deleteGroup);

module.exports = router;
