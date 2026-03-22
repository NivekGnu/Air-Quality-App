import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDash';
import AdminDashboard from './pages/AdminDash';

function PrivateRoute({ user, adminOnly, children }) {
    if (user === null) return <Navigate to="/login" />;
    if (user === undefined) return null; // still loading
    if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
    return children;
}

export default function App() {
    const [user, setUser] = useState(undefined); // undefined = loading

    useEffect(() => {
        // Check if there's an active session on the server
        fetch('/api/auth/me', { credentials: 'include' })
            .then(r => {
                if (!r.ok) return null;  // not logged in, return null
                return r.json();
            })
            .then(data => setUser(data ? data.user : null))
            .catch(() => setUser(null)); // catch any parse errors
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute user={user}>
                            <UserDashboard setUser={setUser} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute user={user} adminOnly>
                            <AdminDashboard setUser={setUser} />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}