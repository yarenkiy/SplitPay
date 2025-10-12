const pool = require('../models/db');

class AuthRepository {
  async findUserByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
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
}

module.exports = new AuthRepository();

