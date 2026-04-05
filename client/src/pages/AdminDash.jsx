import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FanIcon from '../components/FanIcon';


export default function AdminDashboard({ setUser }) {
    const [prediction, setPrediction] = useState(null);
    const [adminInfo, setAdminInfo] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch Admin profile info on load
        fetch('/api/auth/me', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setAdminInfo(data.user))
            .catch(err => console.error("Auth fetch error:", err));
        
        // Note: Automatic AI fetch removed to allow for manual button trigger
    }, []);

    async function triggerAI() {
        setIsGenerating(true);
        try {
            // This hits your ai.js route, which now updates the 'latestPredictionForPi' mailbox
            const r = await fetch('/api/ai/predict', { credentials: 'include' });
            const data = await r.json();
            setPrediction(data);
        } catch (err) {
            console.error("Admin AI Error:", err);
        } finally {
            setIsGenerating(false);
        }
    }

    async function logout() {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        setUser(null);
        navigate('/login');
    }

    return (
        <div className="admin-page">
            {/* Navbar */}
            <nav className="admin-nav">
                <div className="admin-nav__brand">
                    <FanIcon className="admin-nav__fan" />
                    <span className="admin-nav__title">Air Control</span>
                </div>
                <div className="admin-nav__links">
                    <span className="admin-nav__badge">Admin</span>
                    <button className="admin-nav__logout" onClick={logout}>Logout</button>
                </div>
            </nav>

            {/* Hero */}
            <header className="admin-hero">
                <FanIcon className="admin-hero__fan" />
                <h1 className="admin-hero__heading">Admin Dashboard</h1>
                <p className="admin-hero__sub">
                    Logged in as <strong>{adminInfo?.email ?? '—'}</strong>
                </p>
            </header>

            {/* Main Content */}
            <main className="admin-main">

                {/* AI Prediction Card */}
                <section className="admin-card">
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '1.5rem' 
                    }}>
                        <h2 className="admin-card__title" style={{ margin: 0 }}>
                            AI Prediction <span className="admin-card__live">manual</span>
                        </h2>
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
                            {isGenerating ? 'RUNNING...' : 'FORCE PREDICTION'}
                        </button>
                    </div>

                    {isGenerating ? (
                        <div className="admin-loading">
                            <FanIcon className="admin-loading__fan" />
                            <span>Querying Groq LLM & Updating Hardware…</span>
                        </div>
                    ) : prediction ? (
                        <div className="prediction">
                            <div className="prediction__aqi">
                                <span className="prediction__aqi-num">
                                    {prediction.sensorData?.ppm ?? '—'}
                                </span>
                                <span className="prediction__aqi-label">PPM CO₂</span>
                            </div>
                            <div className="prediction__details">
                                <div className="prediction__row">
                                    <span className="prediction__key">Status</span>
                                    <span className="prediction__val">
                                        {prediction.status === 'ok' ? '✅ System Online' : '⚠️ Warning'}
                                    </span>
                                </div>
                                <div className="prediction__row">
                                    <span className="prediction__key">Data Source</span>
                                    <span className="prediction__val">
                                        Last {prediction.sensorData?.sampleCount ?? '—'} minutes
                                    </span>
                                </div>
                                <div className="prediction__row">
                                    <span className="prediction__key">Avg Voltage</span>
                                    <span className="prediction__val">
                                        {prediction.sensorData?.avgVoltage ?? '—'} V
                                    </span>
                                </div>
                                {/* AI Text Analysis */}
                                <div style={{ 
                                    marginTop: '1rem', 
                                    padding: '1rem', 
                                    background: 'rgba(255,255,255,0.05)', 
                                    borderRadius: '8px',
                                    borderLeft: '4px solid #e74c3c'
                                }}>
                                    <p style={{ margin: 0, lineHeight: '1.6', fontSize: '0.95rem' }}>
                                        {prediction.prediction}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: '#999', marginBottom: '0' }}>
                                No active prediction. Use the button above to analyze the latest database logs.
                            </p>
                        </div>
                    )}
                </section>

                {/* System Info Card */}
                <section className="admin-card">
                    <h2 className="admin-card__title">System Infrastructure</h2>
                    <ul className="admin-syslist">
                        <li className="admin-syslist__item">
                            <span className="admin-syslist__key">Edge Device</span>
                            <span className="admin-syslist__val">Raspberry Pi Zero 2 W</span>
                        </li>
                        <li className="admin-syslist__item">
                            <span className="admin-syslist__key">Backend</span>
                            <span className="admin-syslist__val">Express.js · Port 3001</span>
                        </li>
                        <li className="admin-syslist__item">
                            <span className="admin-syslist__key">Database</span>
                            <span className="admin-syslist__val">PostgreSQL (Supabase)</span>
                        </li>
                        <li className="admin-syslist__item">
                            <span className="admin-syslist__key">LLM Provider</span>
                            <span className="admin-syslist__val">Groq (Llama 3.3 70B)</span>
                        </li>
                    </ul>
                </section>

            </main>
        </div>
    );
}