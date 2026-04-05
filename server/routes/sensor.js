const express = require('express');
const router = express.Router();
const db = require('../db');

let breathTester = false;
let latestBreathResult = null; // 1. The "Mailbox" for the result

// Dashboard triggers the test
router.post('/breathalyzer/start', async (req, res) => {
    breathTester = true;
    latestBreathResult = null; // Clear out any old results
    res.json({ ok: true, message: "Breathalyzer started" });
});

// Pi polls this to see if it should start the OLED countdown
router.get('/breathalyzer/check', (req, res) => {
    if (breathTester) {
        breathTester = false;
        res.json({ active: true });
    } else {
        res.json({ active: false });
    }
});

// Pi sends the peak voltage here after someone blows
router.post('/breathalyzer/result', (req, res) => {
    const { voltage } = req.body;
    
    // 2. Put the Pi's data into the mailbox. 
    // React is looking for a variable named 'spike', so we map voltage to spike.
    latestBreathResult = { spike: voltage }; 
    console.log(`[Breathalyzer] Received spike: ${voltage}V`);
    
    res.json({ ok: true });
});

// NEW: React Dashboard polls this every 2 seconds
router.get('/breathalyzer/result', (req, res) => {
    if (latestBreathResult) {
        // 3. Mail is here! Send it to React and clear the mailbox
        res.json(latestBreathResult);
        latestBreathResult = null; 
    } else {
        // Mail isn't here yet, tell React to keep waiting
        res.json({ pending: true }); 
    }
});

// --- Standard Sensor Ingest Below ---

router.post('/ingest', async (req, res) => {
    const { avg_voltage } = req.body;

    if (avg_voltage === undefined) {
        return res.status(400).json({ ok: false, error: "No voltage data received" });
    }

    try {
        const query = `
            INSERT INTO logs (avg_voltage) 
            VALUES ($1) 
            RETURNING *;
        `;
        
        const values = [avg_voltage];
        const result = await db.query(query, values);

        console.log(`[Sensor Sync] Stored to DB: ${avg_voltage}V (ID: ${result.rows[0].id})`);

        res.json({ 
            ok: true, 
            message: "Data stored successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ ok: false, error: "Database insertion failed." });
    }
});

module.exports = router;