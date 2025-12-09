import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', formData);
            login(res.data);
            if (res.data.role === 'admin') navigate('/admin');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            backgroundImage: 'url(/login-glow.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {/* Overlay to ensure text readability on busy backgrounds */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: 0
            }}></div>

            {/* Dark Glass Card */}
            <div className="card" style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '420px',
                background: 'rgba(17, 24, 39, 0.75)', // Dark blue-black
                backdropFilter: 'blur(16px)',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: '#f9fafb', // Light text
                padding: '3rem 2rem'
            }}>
                <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '2.5rem', fontWeight: '800', color: '#fff', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>Welcome</h2>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#9ca3af' }}>Sign in to continue</p>

                {error && <div className="badge" style={{ marginBottom: '1rem', display: 'block', textAlign: 'center', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ color: '#e5e7eb', marginBottom: '0.5rem', fontWeight: '500' }}>Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#fff',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            placeholder="username"
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ color: '#e5e7eb', marginBottom: '0.5rem', fontWeight: '500' }}>Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#fff',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn" style={{
                        width: '100%',
                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', // Blue to Purple
                        border: 'none',
                        color: 'white',
                        padding: '1rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                        transition: 'transform 0.1s'
                    }}>
                        Login
                    </button>
                </form>
                <p style={{ marginTop: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                    New here? <Link to="/register" style={{ color: '#60a5fa', fontWeight: '500', textDecoration: 'none' }}>Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
