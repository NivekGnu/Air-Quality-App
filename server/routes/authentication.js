const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // Needs to add in .env file

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: 'Email and password are required' });

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const userRole = role === 'admin' ? 'admin' : 'user';

        const result = await db.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, passwordHash, userRole]
        );

        res.status(201).json({ user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505')
            return res.status(409).json({ error: 'Email already registered' });
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/login -> When user logs in, generates JWT
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: 'Email and password are required' });

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        const user = result.rows[0];

        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match)
            return res.status(401).json({ error: 'Invalid credentials' });

        // Issue a JWT instead of session
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token }); // client stores JWT in its localstorage
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});


// POST /api/auth/logout
router.post('/logout', (req, res) => {
        res.json({ message: 'Logged out' });
});

// GET /api/auth/me — returns req.user with requireAuth
router.get('/me', require('../middleware/requireAuth'), (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;