require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

const authRoutes = require('./routes/authentication');
const aiRoutes = require('./routes/ai');
const sensorRoutes = require('./routes/sensor');
const requireAuth = require('./middleware/requireAuth');

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://172.20.10.6',  // Raspberry Pi IP
  ],
  credentials: true, // required for sessions to work cross-origin
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/sensor', sensorRoutes);

app.use('/api/ai', aiRoutes);

// Routes for user info and admin dashboard
app.get('/api/user/usage', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query('SELECT api_calls_made FROM users WHERE id = $1', [userId]);
    const made = result.rows[0]?.api_calls_made || 0;

    res.json({ callsRemaining: Math.max(0, 10 - made) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

app.get('/api/admin/users', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleQuery = await db.query('SELECT role FROM users WHERE id = $1', [userId]);

    // Only allow if user is admin
    if (roleQuery.rows.length === 0 || roleQuery.rows[0].role !== 'admin') {
      console.log(`[Security] Unauthorized admin access attempt by User ID: ${userId}`);
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const result = await db.query(
      'SELECT id, email, api_calls_made FROM users ORDER BY api_calls_made DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server is reachable by the Raspberry Pi!');
});