require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./models/db');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notesRoutes = require('./routes/notesRoutes');

// Set default environment variables if not provided
process.env.DB_URL = process.env.DB_URL || 'mysql://root:password@localhost:3306/splitpay';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const app = express();
app.use(cors());
app.use(express.json());

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = require('./models/db');
    const result = await pool.query('SELECT 1 as test');
    res.json({ 
      success: true, 
      message: 'Database connected successfully!',
      test: result.rows[0]?.test || 'OK'
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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notes', notesRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
