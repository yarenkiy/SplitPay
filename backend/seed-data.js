const pool = require('./models/db');
const bcrypt = require('bcrypt');

const seedData = async () => {
  // Wait for database initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  try {
    // Hash password for test users
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Get existing users or create new ones
    let user1 = await pool.query('SELECT id FROM users WHERE email = $1', ['yaren@hotmail.com']);
    if (user1.rows.length === 0) {
      user1 = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
        ['Yaren Joy', 'yaren@hotmail.com', hashedPassword]
      );
    } else {
      // Update existing user's password
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, 'yaren@hotmail.com']
      );
    }
    
    let user2 = await pool.query('SELECT id FROM users WHERE email = $1', ['selen@hotmail.com']);
    if (user2.rows.length === 0) {
      user2 = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
        ['Selen', 'selen@hotmail.com', hashedPassword]
      );
    } else {
      // Update existing user's password
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, 'selen@hotmail.com']
      );
    }
    
    let user3 = await pool.query('SELECT id FROM users WHERE email = $1', ['ahmet@hotmail.com']);
    if (user3.rows.length === 0) {
      user3 = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
        ['Ahmet', 'ahmet@hotmail.com', hashedPassword]
      );
    } else {
      // Update existing user's password
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, 'ahmet@hotmail.com']
      );
    }

    const userId1 = user1.rows[0].id;
    const userId2 = user2.rows[0].id;
    const userId3 = user3.rows[0].id;

    // Create test groups
    const group1 = await pool.query(
      'INSERT INTO groups (name, color, created_by) VALUES ($1, $2, $3) RETURNING id',
      ['Antalya Tatili', '#FF6B6B', userId1]
    );
    
    const group2 = await pool.query(
      'INSERT INTO groups (name, color, created_by) VALUES ($1, $2, $3) RETURNING id',
      ['Ev Arkadaşları', '#4ECDC4', userId1]
    );
    
    const group3 = await pool.query(
      'INSERT INTO groups (name, color, created_by) VALUES ($1, $2, $3) RETURNING id',
      ['Market Gideri', '#45B7D1', userId1]
    );

    const groupId1 = group1.rows[0].id;
    const groupId2 = group2.rows[0].id;
    const groupId3 = group3.rows[0].id;

    // Add members to groups
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId1, userId1]);
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId1, userId2]);
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId1, userId3]);
    
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId2, userId1]);
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId2, userId2]);
    
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId3, userId1]);
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId3, userId2]);

    // Add test expenses
    await pool.query(
      'INSERT INTO expenses (group_id, user_id, paid_by, amount, description) VALUES ($1, $2, $3, $4, $5)',
      [groupId1, userId1, userId2, 120, 'Otel ödemesi']
    );
    
    await pool.query(
      'INSERT INTO expenses (group_id, user_id, paid_by, amount, description) VALUES ($1, $2, $3, $4, $5)',
      [groupId2, userId1, userId2, 300, 'Market alışverişi']
    );
    
    await pool.query(
      'INSERT INTO expenses (group_id, user_id, paid_by, amount, description) VALUES ($1, $2, $3, $4, $5)',
      [groupId3, userId1, userId1, -50, 'Ödeme']
    );

    console.log('Test data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

seedData(); 