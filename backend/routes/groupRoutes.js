const express = require('express');
const router = express.Router();
const { createGroup, addExpense } = require('../controllers/groupController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/', authenticateToken, createGroup);
router.post('/:groupId/expenses', authenticateToken, addExpense);

module.exports = router;
