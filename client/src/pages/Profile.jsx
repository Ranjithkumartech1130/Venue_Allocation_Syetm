import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.token) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setProfile(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching profile', error);
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    if (loading) return <div>Loading Profile...</div>;
    if (!profile) return <div>User details not found.</div>;

    return (
        <div className="container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>User Profile</h2>
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {profile.email || 'Not provided'}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                <p><strong>User ID:</strong> {profile._id}</p>
            </div>
        </div>
    );
};

export default Profile;
