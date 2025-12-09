import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/" className="nav-brand">Venue Allocation</Link>
            <div className="nav-links">
                {user ? (
                    <>
                        <span style={{ display: 'flex', alignItems: 'center' }}>Welcome, {user.username}</span>
                        {user.role === 'admin' && <Link to="/admin" className="nav-link">Admin Dashboard</Link>}
                        <Link to="/dashboard" className="nav-link">Venues</Link>
                        <Link to="/my-bookings" className="nav-link">My Bookings</Link>
                        <Link to="/profile" className="nav-link">Profile</Link>
                        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/register" className="btn btn-primary">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
