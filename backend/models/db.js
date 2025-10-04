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

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase();

module.exports = pool;
