const express = require('express');
const router = express.Router();
const { register, login, logout, forgotPassword, verifyResetCode, resetPassword, changePassword } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;
