import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({ setUser }) {
    const [prediction, setPrediction] = useState(null);
    const [adminInfo, setAdminInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Get current user from session
        fetch('/api/auth/me', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setAdminInfo(data.user));

        // Get AI prediction
        fetch('/api/ai/predict', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setPrediction(data.prediction));
    }, []);

    async function logout() {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        setUser(null);
        navigate('/login');
    }

    return (
        <div style={{ maxWidth: 700, margin: '60px auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Admin Dashboard</h2>
                <button onClick={logout}>Logout</button>
            </div>
            <p>Logged in as admin: <strong>{adminInfo?.email}</strong></p>

            <hr />

            <h3>AI Prediction (live)</h3>
            {prediction ? (
                <div style={{ background: '#fff3cd', borderRadius: 8, padding: 16 }}>
                    <p><strong>Status:</strong> {prediction.quality}</p>
                    <p><strong>AQI:</strong> {prediction.aqi}</p>
                    <p><strong>Forecast:</strong> {prediction.forecast}</p>
                    <p><em>Model stub — replace with real model in Milestone 2</em></p>
                </div>
            ) : (
                <p>Loading prediction...</p>
            )}

            <hr />

            <h3>System Info</h3>
            <ul>
                <li>Backend: Express.js on port 3001</li>
                <li>Database: PostgreSQL</li>
                <li>Auth: express-session</li>
                <li>AI model: Stub — HuggingFace integration coming in M2</li>
            </ul>
        </div>
    );
}