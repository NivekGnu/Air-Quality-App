import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Registration failed');
            return;
        }

        setSuccess('Account created! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
    }

    return (
        <div className="register-page">
            <div className="register-card">
                {/* Logo */}
                <div className="register-logo">
                    <FanIcon className="register-logo__fan" />
                    <span className="register-logo__text">Air Control</span>
                </div>

                <h1 className="register-heading">Create account</h1>
                <p className="register-sub">Start monitoring air quality today</p>

                <div className="register-form">
                    <div className="register-field">
                        <label className="register-label">Email</label>
                        <input
                            className="register-input"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="register-field">
                        <label className="register-label">Password</label>
                        <input
                            className="register-input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="register-field">
                        <label className="register-label">Role</label>
                        <select
                            className="register-select"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {error && <p className="register-error">{error}</p>}
                    {success && <p className="register-success">{success}</p>}

                    <button className="register-btn" onClick={handleSubmit}>
                        Register
                    </button>
                </div>

                <p className="register-footer">
                    Already have an account?{' '}
                    <Link className="register-footer__link" to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}