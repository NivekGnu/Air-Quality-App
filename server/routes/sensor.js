const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/ingest', async (req, res) => {
    const { 
        avg_voltage
    } = req.body;

    if (avg_voltage === undefined) {
        return res.status(400).json({ ok: false, error: "No voltage data received" });
    }

    try {
        // 3. SQL Query
        // Note: I am mapping 'avg_voltage' to your 'voltage' column
        const query = `
            INSERT INTO logs (avg_voltage) 
            VALUES ($1) 
            RETURNING *;
        `;
        
        const values = [avg_voltage];
        
        const result = await db.query(query, values);

        console.log(`[Sensor Sync] Stored to DB: ${avg_voltage}V (ID: ${result.rows[0].id})`);

        // 4. Send success back to the Pi
        res.json({ 
            ok: true, 
            message: "Data stored successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Database Error:', err.message);
        
        // If you haven't added min/max columns yet, this will catch that error
        res.status(500).json({ 
            ok: false, 
            error: "Database insertion failed." 
        });
    }
});

module.exports = router;