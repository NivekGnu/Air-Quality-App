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

function UserRoute({ user, children }) {
    if (user === undefined) return null; // still loading
    if (user !== null) {
        if (user.role === 'admin') {
            return <Navigate to="/admin" />;
        }
        return <Navigate to="/dashboard" />;
    }

    return children;
}

export default function App() {
    const [user, setUser] = useState(undefined); // undefined = loading

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) return setUser(null);

        fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : null)
            .then(data => setUser(data ? data.user : null))
            .catch(() => setUser(null));
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <UserRoute user={user}>
                            <Navigate to="/login" />
                        </UserRoute>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <UserRoute user={user}>
                            <Login setUser={setUser} />
                        </UserRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <UserRoute user={user}>
                            <Register setUser={setUser} />
                        </UserRoute>
                    }
                />
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