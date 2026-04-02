require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const db = require('./db');

const app = express();

const PORT = process.env.PORT || 3001;
const authRoutes = require('./routes/authentication');
const aiRoutes = require('./routes/ai');
const requireAuth = require('./middleware/requireAuth');
const sensorRoutes = require('./routes/sensor');

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://172.20.10.6',  // Raspberry Pi IP
  ],
  credentials: true, // required for sessions to work cross-origin
}));
app.use(express.json());
 
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60, // Max session of one hour
  },
}));

// Public routes
app.use('/api/auth', authRoutes);

app.use('/api/sensor', sensorRoutes);
 
// Needs a valid session to access these routes to protect token usage
app.use('/api/ai', requireAuth, aiRoutes);
 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
