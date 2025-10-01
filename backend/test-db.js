require('dotenv').config();
const pool = require('./models/db'); 

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Database URL:', process.env.DB_URL ? 'Set' : 'Not set');

  try {
    // 1. Basic connection
    console.log('\n1. Testing basic connection...');
    const result1 = await pool.query('SELECT 1');
    console.log('✅ Connection successful!');

    // 2. Simple query
    console.log('\n2. Testing simple query...');
    const result2 = await pool.query('SELECT 1 as test_value');
    console.log('✅ Query successful!');
    console.log('Test value from DB:', result2.rows[0].test_value);

    // 3. Version
    console.log('\n3. Testing database version...');
    const result3 = await pool.query('SELECT VERSION() as version');
    console.log('✅ Version query successful!');
    console.log('Database version:', result3.rows[0].version);

    // 4. Create table
    console.log('\n4. Testing table creation...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Test table created/verified!');

    // 5. Insert and select
    console.log('\n5. Testing insert and select...');
    await pool.query('INSERT INTO test_table (name) VALUES (?)', ['test_user']);
    const selectResult = await pool.query('SELECT * FROM test_table WHERE name = ?', ['test_user']);
    console.log('✅ Insert and select successful!');
    console.log('Inserted record:', selectResult.rows[0]);

    // Cleanup
    await pool.query('DELETE FROM test_table WHERE name = ?', ['test_user']);
    console.log('✅ Cleanup completed!');

    console.log('\n🎉 All database tests passed successfully!');
  } catch (err) {
    console.error('\n❌ Database test failed!');
    console.error(err);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection pool closed.');
  }
}

testDatabaseConnection();
