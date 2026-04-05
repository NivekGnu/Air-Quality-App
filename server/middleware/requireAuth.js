const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1]; // Format -> "Bearer <token>"

    if (!token)
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });

    try {
        // Verifies whether the signature is valid and not expired
        // if either fails, it goes to the catch block
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = decoded; // { id, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = requireAuth;