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
