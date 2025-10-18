const authService = require('../services/authService');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const result = await authService.register(name, email, password);
    res.json(result);
  } catch (error) {
    console.error('Register error:', error);
    if (error.message === 'User already exists') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Login failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    const result = await authService.logout();
    res.json(result);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
};

exports.verifyResetCode = async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    const result = await authService.verifyResetCode(email, verificationCode);
    res.json(result);
  } catch (error) {
    console.error('Verify reset code error:', error);
    if (error.message === 'Invalid or expired verification code') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to verify code' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const result = await authService.resetPassword(email, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    if (error.message === 'No verified reset code found. Please verify your code first.') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // From auth middleware

  try {
    const result = await authService.changePassword(userId, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    if (error.message === 'Current password is incorrect' || error.message === 'User not found') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to change password' });
  }
};
