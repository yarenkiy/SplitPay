const pool = require('../models/db');

class AuthRepository {
  async findUserByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async findUserByIdWithPassword(userId) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    return rows[0] || null;
  }

  async createUser(name, email, hashedPassword) {
    const { rows: newUserResult } = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    return newUserResult.insertId;
  }

  async findUserById(userId) {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
    return rows[0] || null;
  }

  async updateUserPassword(userId, hashedPassword) {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
  }

  async createPasswordResetCode(userId, email, verificationCode, expiresAt) {
    // First, invalidate any existing codes for this user
    await pool.query('UPDATE password_reset_codes SET used = TRUE WHERE user_id = ?', [userId]);
    
    // Create new verification code
    await pool.query(
      'INSERT INTO password_reset_codes (user_id, email, verification_code, expires_at) VALUES (?, ?, ?, ?)',
      [userId, email, verificationCode, expiresAt]
    );
  }

  async findPasswordResetCode(email, verificationCode) {
    const { rows } = await pool.query(
      'SELECT * FROM password_reset_codes WHERE email = ? AND verification_code = ? AND used = FALSE AND expires_at > NOW()',
      [email, verificationCode]
    );
    return rows[0] || null;
  }

  async markCodeAsVerified(email, verificationCode) {
    await pool.query(
      'UPDATE password_reset_codes SET verified = TRUE WHERE email = ? AND verification_code = ?',
      [email, verificationCode]
    );
  }

  async markCodeAsUsed(email, verificationCode) {
    await pool.query(
      'UPDATE password_reset_codes SET used = TRUE WHERE email = ? AND verification_code = ?',
      [email, verificationCode]
    );
  }

  async findVerifiedResetCode(email) {
    const { rows } = await pool.query(
      'SELECT * FROM password_reset_codes WHERE email = ? AND verified = TRUE AND used = FALSE AND expires_at > NOW()',
      [email]
    );
    return rows[0] || null;
  }
}

module.exports = new AuthRepository();

