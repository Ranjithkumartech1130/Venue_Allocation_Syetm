import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import VenueCard from '../components/VenueCard';

const Dashboard = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVenues = async () => {
        try {
            const res = await api.get('/venues');
            setVenues(res.data);
        } catch (error) {
            console.error('Error fetching venues:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVenues();
    }, []);

    if (loading) return <div className="container" style={{ textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>Available Venues</h1>
            {venues.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No venues found.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {venues.map(venue => (
                        <VenueCard key={venue._id} venue={venue} availableVenues={venues} refreshBookings={fetchVenues} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
