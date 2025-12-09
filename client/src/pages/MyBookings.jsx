import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.token) {
            fetchBookings();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            // Use the configured api instance which handles headers via interceptor
            // Or manually: headers: { Authorization: `Bearer ${user.token}` }
            // Let's use manual for minimal change risk, but correct the variable.
            const res = await axios.get('http://localhost:5000/api/bookings', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setBookings(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching bookings', error);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (!status) return '#f8f9fa';
        if (status === 'confirmed') return '#d4edda';
        if (status === 'cancelled') return '#f8d7da';
        if (status.startsWith('pending')) return '#fff3cd';
        return '#f8f9fa';
    };

    const getStatusText = (status) => {
        if (!status) return 'Unknown';
        switch (status) {
            case 'confirmed': return <span style={{ color: 'green', fontWeight: 'bold' }}>Confirmed</span>;
            case 'cancelled': return <span style={{ color: 'red', fontWeight: 'bold' }}>Rejected/Cancelled</span>;
            case 'pending_level_1': return <span style={{ color: '#856404', fontWeight: 'bold' }}>Pending Level 1 (HOD)</span>;
            case 'pending_level_2': return <span style={{ color: '#856404', fontWeight: 'bold' }}>Pending Level 2 Approval</span>;
            case 'pending_level_3': return <span style={{ color: '#856404', fontWeight: 'bold' }}>Pending Level 3 Approval</span>;
            case 'pending_level_4': return <span style={{ color: '#856404', fontWeight: 'bold' }}>Pending Level 4 Approval</span>;
            default: return status.startsWith('pending') ? <span style={{ color: '#856404', fontWeight: 'bold' }}>Pending Approval</span> : status;
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container" style={{ padding: '20px' }}>
            <h2>My Bookings</h2>
            {bookings.length === 0 ? (
                <p>No bookings found.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', backgroundColor: '#eee' }}>
                            <th style={{ padding: '10px' }}>Venue</th>
                            <th style={{ padding: '10px' }}>Start Time</th>
                            <th style={{ padding: '10px' }}>End Time</th>
                            <th style={{ padding: '10px' }}>Purpose</th>
                            <th style={{ padding: '10px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(booking => (
                            <tr key={booking._id} style={{ borderBottom: '1px solid #ddd', backgroundColor: getStatusColor(booking.status) }}>
                                <td style={{ padding: '10px' }}>{booking.venue ? booking.venue.name : 'Unknown'}</td>
                                <td style={{ padding: '10px' }}>{new Date(booking.startTime).toLocaleString()}</td>
                                <td style={{ padding: '10px' }}>{new Date(booking.endTime).toLocaleString()}</td>
                                <td style={{ padding: '10px' }}>{booking.purpose}</td>
                                <td style={{ padding: '10px' }}>{getStatusText(booking.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MyBookings;
