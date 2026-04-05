import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FanIcon from '../components/FanIcon';

export default function Login({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Login failed');
            return;
        }

        setUser(data.user);

        if (data.user.role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Logo */}
                <div className="login-logo">
                    <FanIcon className="login-logo__fan" />
                    <span className="login-logo__text">Air Control</span>
                </div>

                <h1 className="login-heading">Welcome back</h1>
                <p className="login-sub">Sign in to your account</p>

                <div className="login-form">
                    <div className="login-field">
                        <label className="login-label">Email</label>
                        <input
                            className="login-input"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label">Password</label>
                        <input
                            className="login-input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button className="login-btn" onClick={handleSubmit}>
                        Log in
                    </button>
                </div>

                <p className="login-footer">
                    No account?{' '}
                    <Link className="login-footer__link" to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}