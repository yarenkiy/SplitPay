const express = require('express');
const router = express.Router();
const { createGroup, addExpense, getGroupMembers, searchUsers, joinGroupByCode, getGroupDetails } = require('../controllers/groupController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/', authenticateToken, createGroup);
router.post('/join', authenticateToken, joinGroupByCode);
router.get('/:groupId/details', authenticateToken, getGroupDetails);
router.post('/:groupId/expenses', authenticateToken, addExpense);
router.get('/:groupId/members', authenticateToken, getGroupMembers);
router.get('/search/users', authenticateToken, searchUsers);

module.exports = router;
