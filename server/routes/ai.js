const express = require('express');
const router = express.Router();

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /api/ai/predict
router.get('/predict', async (req, res) => {
    try {
        const response = await fetch(`${AI_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                aqi: 42,
                quality: 'Good',
                pm25: 12.5,
                humidity: 30,
                temp: 5,
            }),
        });

        const data = await response.json();
        res.json(data);
    } catch (err) {
        // Fallback to stub if Python sidecar is not running
        console.error('AI sidecar not reachable:', err.message);
        res.json({
            status: 'stub',
            prediction: {
                quality: 'Good',
                aqi: 42,
                forecast: 'AI model not reachable — returning stub data',
                confidence: 0.85,
            },
        });
    }
});

module.exports = router;