const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authRepository = require('../repositories/authRepository');
const emailService = require('./emailService');

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

  async forgotPassword(email) {
    // Find user by email
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, a verification code has been sent.' };
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 600000); // 10 minutes from now

    // Save verification code to database
    await authRepository.createPasswordResetCode(user.id, email, verificationCode, expiresAt);

    try {
      // Send verification email
      await emailService.sendVerificationCode(email, verificationCode, user.name);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error.message);
      // Still log the code for development purposes
      console.log(`Development - Verification code for ${email}: ${verificationCode}`);
    }

    return { message: 'If an account with that email exists, a verification code has been sent.' };
  }

  async verifyResetCode(email, verificationCode) {
    // Find valid verification code
    const resetCode = await authRepository.findPasswordResetCode(email, verificationCode);

    if (!resetCode) {
      throw new Error('Invalid or expired verification code');
    }

    // Mark code as verified
    await authRepository.markCodeAsVerified(email, verificationCode);

    return { message: 'Verification code verified successfully' };
  }

  async resetPassword(email, newPassword) {
    // Find verified reset code
    const resetCode = await authRepository.findVerifiedResetCode(email);

    if (!resetCode) {
      throw new Error('No verified reset code found. Please verify your code first.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await authRepository.updateUserPassword(resetCode.user_id, hashedPassword);

    // Mark code used
    await authRepository.markCodeAsUsed(email, resetCode.verification_code);

    // Send success email
    try {
      const user = await authRepository.findUserByIdWithPassword(resetCode.user_id);
      await emailService.sendPasswordResetSuccess(email, user.name);
      console.log(`✅ Password reset success email sent to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send success email to ${email}:`, error.message);
    }

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId, currentPassword, newPassword) {
    // Find user by ID with password
    const user = await authRepository.findUserByIdWithPassword(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await authRepository.updateUserPassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();

