const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

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

// POST /api/auth/login
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

        // Save user info to session
        req.session.user = { id: user.id, email: user.email, role: user.role };

        res.json({ user: req.session.user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: 'Logged out' });
    });
});

// GET /api/auth/me — returns current logged-in user from session
router.get('/me', (req, res) => {
    if (!req.session.user)
        return res.status(401).json({ error: 'Not logged in' });
    res.json({ user: req.session.user });
});

module.exports = router;