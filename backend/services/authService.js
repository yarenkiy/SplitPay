const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/authRepository');

class AuthService {
  async register(name, email, password) {
    // Check if user already exists
    const existingUser = await authRepository.findUserByEmail(email);
    
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await authRepository.createUser(name, email, hashedPassword);

    // Get the newly created user
    const newUser = await authRepository.findUserById(userId);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET
    );

    return { token, user: newUser };
  }

  async login(email, password) {
    // Find user by email
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email }
    };
  }

  async logout() {
    // JWT is stateless, so logout is handled client-side
    return { message: 'Logged out successfully' };
  }
}

module.exports = new AuthService();

