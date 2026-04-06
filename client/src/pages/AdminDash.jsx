import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FanIcon from '../components/FanIcon';

export default function AdminDashboard({ setUser }) {
    const [prediction, setPrediction] = useState(null);
    const [adminInfo, setAdminInfo] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const navigate = useNavigate();
    // For breathalyzer testing
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
            .then(data => setAdminInfo(data.user))
            .catch(err => console.error("Auth fetch error:", err));

        const reloadAllUsers = () => {
            fetch('/api/admin/users', { headers })
                .then(r => r.json())
                .then(data => setAllUsers(data))
                .catch(err => console.error("Admin users fetch error:", err));
        };

        reloadAllUsers();
        const interval = setInterval(reloadAllUsers, 15000);

        return () => clearInterval(interval);
    }, []);

    async function triggerAI() {
        setIsGenerating(true);
        const token = localStorage.getItem('token');
        try {
            const r = await fetch('/api/ai/predict', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await r.json();
            setPrediction(data);

            const usersRes = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const usersData = await usersRes.json();
            setAllUsers(usersData);
        } catch (err) {
            console.error("Admin AI Error:", err);
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
                            {isGenerating ? 'RUNNING...' : 'GENERATE PREDICTION'}
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

                <section className="admin-card">
                    <h2 className="admin-card__title">User API Consumption</h2>
                    <p style={{ color: '#999', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Monitor Groq LLM usage across all registered accounts. Maximum free tier limit is 10 calls.
                    </p>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#ecf0f1' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', background: 'rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '12px' }}>User Email</th>
                                    <th style={{ padding: '12px' }}>Calls Made</th>
                                    <th style={{ padding: '12px' }}>Calls Remaining</th>
                                    <th style={{ padding: '12px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(user => {
                                    const maxCalls = 10;
                                    const remaining = Math.max(0, maxCalls - (user.api_calls_made || 0));
                                    const isMaxed = remaining === 0;

                                    return (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
                                            <td style={{ padding: '12px' }}>{user.email}</td>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{user.api_calls_made || 0}</td>
                                            <td style={{ padding: '12px', color: isMaxed ? '#e74c3c' : '#2ecc71' }}>
                                                {remaining}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {isMaxed ? '🛑 Blocked' : '✅ Active'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {allUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
                                            Loading users...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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