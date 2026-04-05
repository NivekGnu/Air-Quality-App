import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FanIcon from '../components/FanIcon';

export default function UserDashboard({ setUser }) {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();
    const [breathResult, setBreathResult] = useState(null);
    const [breathTesting, setBreathTesting] = useState(false);

    async function startBreathalyzer() {
        setBreathTesting(true);
        setBreathResult(null);

        await fetch('/api/sensor/breathalyzer/start', {
            method: 'POST',
            credentials: 'include',
        });

        // poll for result
        const interval = setInterval(async () => {
            const r = await fetch('/api/sensor/breathalyzer/result', {
                credentials: 'include'
            });
            const data = await r.json();
            if (data.spike !== undefined) {
                clearInterval(interval);
                setBreathTesting(false);

                if (data.spike > 1.5) {
                    setBreathResult({ emoji: '🤢', message: "Yikes... you ok?" });
                } else if (data.spike > 0.8) {
                    setBreathResult({ emoji: '🤔', message: "Hmm, drink some water" });
                } else {
                    setBreathResult({ emoji: '✅', message: "Fresh as a daisy!" });
                }
            }
        }, 2000);
    }

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        fetch('/api/auth/me', { headers })
            .then(r => r.json())
            .then(data => setUserInfo(data.user))
            .catch(err => console.error("Auth fetch error:", err));
    }, []);

    async function triggerAI() {
        setIsGenerating(true);
        const token = localStorage.getItem('token'); // Grab the token

        try {
            const r = await fetch('/api/ai/predict', {
                headers: { Authorization: `Bearer ${token}` } // Send the token!
            });

            const data = await r.json();

            // Catch the 403 API Limit error from the server
            if (r.status === 403) {
                alert(data.message); // Simple popup telling them they are out of credits
                setIsGenerating(false);
                return; // Stop running
            }

            setPrediction(data);

        } catch (err) {
            console.error("AI Error:", err);
        } finally {
            setIsGenerating(false);
        }
    }

    async function logout() {
        localStorage.removeItem('token'); // Deletes the token
        await fetch('/api/auth/logout', {
            method: 'POST'
        });
        setUser(null);
        navigate('/login');
    }

    return (
        <div className="udash-page">
            <nav className="udash-nav">
                <div className="udash-nav__brand">
                    <FanIcon className="udash-nav__fan" />
                    <span className="udash-nav__title">Air Control</span>
                </div>
                <button className="udash-nav__logout" onClick={logout}>Logout</button>
            </nav>

            <header className="udash-hero">
                <FanIcon className="udash-hero__fan" />
                <h1 className="udash-hero__heading">Air Quality Dashboard</h1>
                <p className="udash-hero__sub">
                    Welcome back, <strong>{userInfo?.email ?? '—'}</strong>
                </p>
            </header>

            <main className="udash-main">
                <section className="udash-card">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <div>
                            <h2 className="udash-card__title" style={{ margin: 0 }}>
                                Current Air Quality
                            </h2>
                            {/* NEW: Display calls remaining */}
                            {callsRemaining !== null && (
                                <span style={{ fontSize: '0.85rem', color: callsRemaining === 0 ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>
                                    {callsRemaining} free predictions remaining
                                </span>
                            )}
                        </div>
                        <button
                            onClick={triggerAI}
                            disabled={isGenerating}
                            style={{
                                background: isGenerating ? '#666' : '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '10px 20px',
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                transition: 'background 0.3s ease'
                            }}
                        >
                            {isGenerating ? 'RUNNING...' : callsRemaining === 0 ? 'LIMIT REACHED' : 'GENERATE PREDICTION'}
                        </button>
                    </div>

                    {isGenerating ? (
                        <div className="udash-loading">
                            <FanIcon className="udash-loading__fan" />
                            <span>Fetching data…</span>
                        </div>
                    ) : prediction ? (
                        <div className="udash-prediction">
                            <div className="udash-aqi">
                                <span className="udash-aqi__num">
                                    {prediction.sensorData?.ppm ?? '—'}
                                </span>
                                <span className="udash-aqi__label">PPM CO₂</span>
                            </div>
                            <div className="udash-details">
                                <div className="udash-row">
                                    <span className="udash-row__key">Samples</span>
                                    <span className="udash-row__val">
                                        Last {prediction.sensorData?.sampleCount ?? '—'} readings
                                    </span>
                                </div>
                                <div className="udash-row">
                                    <span className="udash-row__key">Avg Voltage</span>
                                    <span className="udash-row__val">
                                        {prediction.sensorData?.avgVoltage ?? '—'} V
                                    </span>
                                </div>
                                <p style={{ marginTop: '0.75rem', lineHeight: '1.6', fontSize: '0.9rem' }}>
                                    {prediction.prediction}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: '#999' }}>
                                No active prediction. Use the button above to analyze the latest sensor data.
                            </p>
                        </div>
                    )}
                </section>

                <section className="udash-card">
                    <h2 className="udash-card__title">Breathalyzer</h2>
                    <p style={{ color: '#999', marginBottom: '1rem' }}>
                        Point the MQ135 sensor toward you and press the button
                    </p>
                    <button
                        onClick={startBreathalyzer}
                        disabled={breathTesting}
                        style={{
                            background: breathTesting ? '#666' : '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '10px 20px',
                            cursor: breathTesting ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        {breathTesting ? 'ANALYZING...' : 'START BREATHALYZER'}
                    </button>

                    {breathResult && (
                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '3rem' }}>{breathResult.emoji}</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {breathResult.message}
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}