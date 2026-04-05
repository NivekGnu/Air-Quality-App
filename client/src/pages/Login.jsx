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

export default function Login({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Stores the token
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        // Routes to authentication.js /login to generate token
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        // Saves the handed token from the server
        const data = await res.json();
        // To check in Dev tools
        // console.log('Response:', data);

        if (!res.ok) {
            setError(data.error || 'Login failed');
            return;
        }

        // Stores JWT to localStorage
        localStorage.setItem('token', data.token);
        
        // Parse user information from the token payload
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        setUser(payload);

        if (payload.role === 'admin') {
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