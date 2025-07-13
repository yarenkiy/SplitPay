require('dotenv').config();
const pool = require('./models/db');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Database URL:', process.env.DB_URL ? 'Set' : 'Not set');
  
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Test simple query
    console.log('\n2. Testing simple query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful!');
    console.log('Current time from DB:', result.rows[0].current_time);
    
    // Test database version
    console.log('\n3. Testing database version...');
    const versionResult = await client.query('SELECT version()');
    console.log('✅ Version query successful!');
    console.log('Database version:', versionResult.rows[0].version.split(' ')[0]);
    
    // Test if we can create a simple table (optional)
    console.log('\n4. Testing table creation...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Test table created/verified!');
    
    // Test insert and select
    console.log('\n5. Testing insert and select...');
    await client.query('INSERT INTO test_table (name) VALUES ($1)', ['test_user']);
    const selectResult = await client.query('SELECT * FROM test_table WHERE name = $1', ['test_user']);
    console.log('✅ Insert and select successful!');
    console.log('Inserted record:', selectResult.rows[0]);
    
    // Clean up
    await client.query('DELETE FROM test_table WHERE name = $1', ['test_user']);
    console.log('✅ Cleanup completed!');
    
    client.release();
    
    console.log('\n🎉 All database tests passed successfully!');
    console.log('Your database connection is working properly.');
    
  } catch (err) {
    console.error('\n❌ Database test failed!');
    console.error('Error:', err.message);
    console.error('Full error:', err);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if your database server is running');
      console.log('2. Verify the DB_URL in your .env file');
      console.log('3. Check if the port number is correct');
    } else if (err.code === '28P01') {
      console.log('\n💡 Authentication failed. Check your username/password in DB_URL');
    } else if (err.code === '3D000') {
      console.log('\n💡 Database does not exist. Create the database first');
    }
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection pool closed.');
  }
}

// Run the test
testDatabaseConnection(); 