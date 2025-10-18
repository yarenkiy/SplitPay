const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL connection pool
const connectionString = process.env.DB_URL || 'mysql://root:password@localhost:8889/splitpay';
const mysqlPool = mysql.createPool(connectionString);

// Provide a pg-like wrapper for compatibility: query, connect, end
const pool = {
  query: async (text, params = []) => {
    const [rows] = await mysqlPool.execute(text, params);
    return { rows };
  },
  connect: async () => {
    const connection = await mysqlPool.getConnection();
    return {
      query: async (text, params = []) => {
        const [rows] = await connection.execute(text, params);
        return { rows };
      },
      release: () => connection.release()
    };
  },
  end: async () => mysqlPool.end()
};

// Initialize database with tables
const initializeDatabase = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#6366F1',
        invite_code VARCHAR(6) UNIQUE NOT NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_groups_created_by FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);

    // Group members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT,
        user_id INT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES \`groups\` (id),
        CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT,
        user_id INT,
        paid_by INT,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        currency VARCHAR(3) DEFAULT 'TRY',
        currency_symbol VARCHAR(5) DEFAULT '₺',
        participants_count INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_expenses_group FOREIGN KEY (group_id) REFERENCES \`groups\` (id),
        CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users (id),
        CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by) REFERENCES users (id)
      )
    `);

    // Notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_notes_group FOREIGN KEY (group_id) REFERENCES \`groups\` (id) ON DELETE CASCADE,
        CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Password reset verification codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        verification_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_password_reset_codes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        INDEX idx_verification_code (verification_code),
        INDEX idx_user_id (user_id),
        INDEX idx_email (email)
      )
    `);

    // Migration: Add participants_count to existing expenses table if not exists
    try {
      await pool.query(`
        ALTER TABLE expenses 
        ADD COLUMN participants_count INT DEFAULT 1
      `);
      console.log('✅ Added participants_count column to expenses table');
    } catch (err) {
      // Ignore error if column already exists
      if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column name')) {
        console.log('ℹ️  participants_count column already exists');
      } else {
        throw err;
      }
    }

    // Migration: Update existing expenses - mark shared expenses as participants_count = 2
    await pool.query(`
      UPDATE expenses 
      SET participants_count = 2 
      WHERE description IN ('Airbnb', 'Shopping', 'Beach bed', 'Transport', 'Food', 'Health')
    `);
    console.log('ℹ️  Updated participants_count for shared expenses to 2');

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase();

module.exports = pool;
