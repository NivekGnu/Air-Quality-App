const express = require('express');
const router = express.Router();
//const db = require('../db');

router.post('/ingest', async (req, res) => {
    const { signal } = req.body;
    const quality = signal ? 'Good' : 'Poor';

    console.log('Received signal:', signal, '-> Quality:', quality);

    res.json({ ok: true, quality });
});

module.exports = router;