import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FanIcon({ className }) {
    return (
        <svg
            className={className}
            width="54"
            height="54"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            {[0, 90, 180, 270].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 50 50)`}>
                    <ellipse cx="50" cy="28" rx="15" ry="24" fill="white" opacity="0.95" />
                </g>
            ))}
            <circle cx="50" cy="50" r="7" fill="#0f1b2d" />
            <circle cx="50" cy="50" r="3.5" fill="white" opacity="0.5" />
        </svg>
    );
}

export default function AdminDashboard({ setUser }) {
    const [prediction, setPrediction] = useState(null);
    const [adminInfo, setAdminInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setAdminInfo(data.user));

        fetch('/api/ai/predict', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setPrediction(data));
    }, []);

    async function logout() {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        setUser(null);
        navigate('/login');
    }

    const getAqiClass = (aqi) => {
        if (!aqi) return '';
        if (aqi <= 50) return 'aqi-good';
        if (aqi <= 100) return 'aqi-moderate';
        if (aqi <= 150) return 'aqi-sensitive';
        return 'aqi-poor';
    };

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

            {/* Cards */}
            <main className="admin-main">

                {/* AI Prediction Card */}
<section className="admin-card">
    <h2 className="admin-card__title">
        AI Prediction <span className="admin-card__live">live</span>
    </h2>
    {prediction ? (
        <div className="prediction">
            {/* PPM 수치 */}
            <div className="prediction__aqi">
                <span className="prediction__aqi-num">
                    {prediction.sensorData?.ppm ?? '—'}
                </span>
                <span className="prediction__aqi-label">PPM</span>
            </div>
            <div className="prediction__details">
                <div className="prediction__row">
                    <span className="prediction__key">Status</span>
                    <span className="prediction__val">
                        {prediction.status === 'ok' ? '✅ Online' : '⚠️ Warning'}
                    </span>
                </div>
                <div className="prediction__row">
                    <span className="prediction__key">Samples</span>
                    <span className="prediction__val">
                        {prediction.sensorData?.sampleCount ?? '—'} readings
                    </span>
                </div>
                {/* AI Text */}
                <p style={{ marginTop: '0.75rem', lineHeight: '1.6', fontSize: '0.9rem' }}>
                    {prediction.prediction}
                </p>
            </div>
        </div>
    ) : (
        <div className="admin-loading">
            <FanIcon className="admin-loading__fan" />
            <span>Fetching prediction…</span>
        </div>
    )}
</section>

                {/* System Info Card */}
                <section className="admin-card">
                    <h2 className="admin-card__title">System Info</h2>
                    <ul className="admin-syslist">
                        <li className="admin-syslist__item">
                            <span className="admin-syslist__key">Backend</span>
                            <span className="admin-syslist__val">Express.js · port 3001</span>
                        </li>
                        <li className="admin-syslist__item">
                            <span className="admin-syslist__key">Database</span>
                            <span className="admin-syslist__val">PostgreSQL</span>
                        </li>
                        <li className="admin-syslist__item">
                            <span className="admin-syslist__key">Auth</span>
                            <span className="admin-syslist__val">express-session</span>
                        </li>
                        <li className="admin-syslist__item">
                            <span className="admin-syslist__key">AI Model</span>
                            <span className="admin-syslist__val">Stub — HuggingFace in M2</span>
                        </li>
                    </ul>
                </section>

            </main>
        </div>
    );
}