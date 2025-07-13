require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./models/db');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json({ 
      success: true, 
      message: 'Database connected successfully!',
      timestamp: result.rows[0].now 
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: err.message 
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
