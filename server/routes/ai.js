const express = require('express');
const router = express.Router();
const db = require('../db');

// ── Sensor constants for the PPM formula ──
const VCC  = parseFloat(process.env.SENSOR_VCC  || '5.0');   // Supplied voltage
const RL   = parseFloat(process.env.SENSOR_RL   || '10.0');  // Load resistance (kΩ)
const RO   = parseFloat(process.env.SENSOR_RO   || '10.0');  // Clean-air baseline resistance (kΩ)
const A    = 110.47;   // CO2 scaling factor
const B    = -2.862;   // CO2 exponent

// ── Groq config ──
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── Helper: Voltage → Rs ──
// Rs = ((Vcc - Vout) / Vout) × RL
function voltageToRs(voltage) {
    if (voltage <= 0) throw new Error('Invalid voltage: must be > 0');
    return ((VCC - voltage) / voltage) * RL;
}

// ── Helper: Rs → PPM using PPM = a × (Rs/Ro)^b ───────────────
function rsToPPM(rs) {
    return A * Math.pow(rs / RO, B);
}

// GET /api/ai/predict
router.get('/predict', async (req, res) => {
    try {
        // Step 1: Fetch the last 10 rows from the Logs DB
        const result = await db.query(
            `SELECT avg_voltage
             FROM logs
             ORDER BY created_at DESC
             LIMIT 10`
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No sensor data available in logs.' });
        }

        // Step 2: Calculates the avg voltage into PPM
        const voltages  = result.rows.map(r => parseFloat(r.avg_voltage));
        const avgVoltage = voltages.reduce((sum, v) => sum + v, 0) / voltages.length;
        const rs         = voltageToRs(avgVoltage);
        const ppm        = rsToPPM(rs);

        console.log(`[AI] avgVoltage=${avgVoltage.toFixed(4)}V | Rs=${rs.toFixed(4)}kΩ | PPM=${ppm.toFixed(2)}`);

        // Step 3: Groq API calls
        const prompt =
            `This is the average CO2 concentration for the last 10 minutes: ${ppm.toFixed(2)} PPM. ` +
            `Based on this data, predict the current air quality status, any potential health risks, ` +
            `and recommend actions if necessary. Be concise and practical.`;

            const groqResponse = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 300,
                temperature: 0.5,
            }),
        });

        if (!groqResponse.ok) {
            const errText = await groqResponse.text();
            throw new Error(`Groq API error ${groqResponse.status}: ${errText}`);
        }

        const groqData  = await groqResponse.json();
        const aiMessage = groqData.choices?.[0]?.message?.content || 'No response from AI.';

        // Step 4: Returns a reply for the Client
        res.json({
            status: 'ok',
            sensorData: {
                sampleCount: voltages.length,
                avgVoltage:  parseFloat(avgVoltage.toFixed(4)),
                rs:          parseFloat(rs.toFixed(4)),
                ppm:         parseFloat(ppm.toFixed(2)),
            },
            prediction: aiMessage,
        });
    } catch (err) {
        console.error('[AI] predict error:', err.message);
        res.status(500).json({
            error:   'Failed to generate prediction.',
            details: err.message,
        });
    }
});

module.exports = router;