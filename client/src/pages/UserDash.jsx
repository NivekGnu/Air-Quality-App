import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard({ setUser }) {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Get current user from session
        fetch('/api/auth/me', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setUserInfo(data.user));

        // Get AI prediction
        fetch('/api/ai/predict', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                setPrediction(data.prediction);
                setLoading(false);
            });
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
        <div style={{ maxWidth: 600, margin: '60px auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Air Quality Dashboard</h2>
                <button onClick={logout}>Logout</button>
            </div>
            <p>Welcome, <strong>{userInfo?.email}</strong></p>

            <hr />

            <h3>Current Air Quality</h3>
            {loading ? (
                <p>Loading...</p>
            ) : prediction ? (
                <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
                    <p><strong>Status:</strong> {prediction.quality}</p>
                    <p><strong>AQI:</strong> {prediction.aqi}</p>
                    <p><strong>Forecast:</strong> {prediction.forecast}</p>
                    <p><strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(0)}%</p>
                </div>
            ) : (
                <p>No data available.</p>
            )}
        </div>
    );
}