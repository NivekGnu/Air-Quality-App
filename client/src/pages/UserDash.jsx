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

export default function UserDashboard({ setUser }) {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setUserInfo(data.user));

        fetch('/api/ai/predict', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                setPrediction(data);
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

    const getAqiClass = (aqi) => {
        if (!aqi) return '';
        if (aqi <= 50)  return 'udash-aqi--good';
        if (aqi <= 100) return 'udash-aqi--moderate';
        if (aqi <= 150) return 'udash-aqi--sensitive';
        return 'udash-aqi--poor';
    };

    const getAqiLabel = (aqi) => {
        if (!aqi) return '';
        if (aqi <= 50)  return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Sensitive';
        return 'Poor';
    };

    return (
        <div className="udash-page">
            {/* Navbar */}
            <nav className="udash-nav">
                <div className="udash-nav__brand">
                    <FanIcon className="udash-nav__fan" />
                    <span className="udash-nav__title">Air Control</span>
                </div>
                <button className="udash-nav__logout" onClick={logout}>Logout</button>
            </nav>

            {/* Hero */}
            <header className="udash-hero">
                <FanIcon className="udash-hero__fan" />
                <h1 className="udash-hero__heading">Air Quality Dashboard</h1>
                <p className="udash-hero__sub">
                    Welcome back, <strong>{userInfo?.email ?? '—'}</strong>
                </p>
            </header>

            {/* Main */}
            <main className="udash-main">

                {/* AQI Card */}
                <section className="udash-card">
                    <h2 className="udash-card__title">Current Air Quality</h2>

                    {loading ? (
    <div className="udash-loading">
        <FanIcon className="udash-loading__fan" />
        <span>Fetching data…</span>
    </div>
) : prediction ? (
    <div className="udash-prediction">
        {/* PPM 수치 */}
        <div className="udash-aqi">
            <span className="udash-aqi__num">
                {prediction.sensorData?.ppm ?? '—'}
            </span>
            <span className="udash-aqi__label">PPM CO₂</span>
        </div>

        {/* AI 텍스트 */}
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
    <p className="udash-empty">No data available.</p>
)}
                </section>

            </main>
        </div>
    );
}