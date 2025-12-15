import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
    const [venues, setVenues] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('venues'); // venues | bookings
    const [venueForm, setVenueForm] = useState({
        name: '',
        capacity: '',
        description: '',
        image: '',
        facilities: { ac: false, mic: false, projector: false }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const fetchVenues = async () => {
        try {
            const res = await api.get('/venues');
            setVenues(res.data);
        } catch (error) {
            console.error('Error fetching venues:', error);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            setBookings(res.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    useEffect(() => {
        fetchVenues();
        fetchBookings();
    }, []);

    const handleVenueSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/venues/${editId}`, venueForm);
            } else {
                await api.post('/venues', venueForm);
            }
            setVenueForm({ name: '', capacity: '', description: '', image: '', facilities: { ac: false, mic: false, projector: false } });
            setIsEditing(false);
            setEditId(null);
            fetchVenues();
        } catch (error) {
            console.error('Error saving venue:', error);
            alert('Failed to save venue');
        }
    };

    const handleEditVenue = (venue) => {
        setVenueForm({
            name: venue.name,
            capacity: venue.capacity,
            description: venue.description,
            image: venue.image || '',
            facilities: venue.facilities || { ac: false, mic: false, projector: false }
        });
        setIsEditing(true);
        setEditId(venue._id);
        setActiveTab('venues');
    };

    const handleDeleteVenue = async (id) => {
        if (!window.confirm('Are you sure? This will delete the venue and potentially corrupt bookings.')) return;
        try {
            await api.delete(`/venues/${id}`);
            fetchVenues();
        } catch (error) {
            console.error('Error deleting venue:', error);
        }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm('Cancel this booking?')) return;
        try {
            await api.delete(`/bookings/${id}`);
            fetchBookings();
        } catch (error) {
            console.error('Error cancelling booking:', error);
        }
    };

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3>Total Venues</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{venues.length}</p>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)', color: 'white' }}>
                    <h3>Bookings Today</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {bookings.filter(b => {
                            const bookingDate = new Date(b.startTime);
                            const today = new Date();
                            return bookingDate.toDateString() === today.toDateString();
                        }).length}
                    </p>
                </div>
            </div>

            <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                <button
                    className={`btn ${activeTab === 'venues' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ marginRight: '1rem', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                    onClick={() => setActiveTab('venues')}
                >
                    Manage Venues
                </button>
                <button
                    className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                    onClick={() => setActiveTab('bookings')}
                >
                    Manage Bookings
                </button>
            </div>

            {activeTab === 'venues' && (
                <>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3>{isEditing ? 'Edit Venue' : 'Add New Venue'}</h3>
                        <form onSubmit={handleVenueSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Name</label>
                                <input value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} required />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Image URL <span style={{ fontSize: '0.8rem', color: '#666' }}>(Paste link)</span></label>
                                <input value={venueForm.image} onChange={e => setVenueForm({ ...venueForm, image: e.target.value })} placeholder="http://example.com/image.jpg" />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Capacity</label>
                                <input type="number" value={venueForm.capacity} onChange={e => setVenueForm({ ...venueForm, capacity: e.target.value })} required />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Description</label>
                                <input value={venueForm.description} onChange={e => setVenueForm({ ...venueForm, description: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.5rem', margin: '0.5rem 0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={venueForm.facilities.ac}
                                        onChange={e => setVenueForm({ ...venueForm, facilities: { ...venueForm.facilities, ac: e.target.checked } })}
                                    /> AC
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={venueForm.facilities.mic}
                                        onChange={e => setVenueForm({ ...venueForm, facilities: { ...venueForm.facilities, mic: e.target.checked } })}
                                    /> Mic
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={venueForm.facilities.projector}
                                        onChange={e => setVenueForm({ ...venueForm, facilities: { ...venueForm.facilities, projector: e.target.checked } })}
                                    /> Projector
                                </label>
                            </div>
                            <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Add'}</button>
                            {isEditing && <button type="button" className="btn btn-secondary" onClick={() => { setIsEditing(false); setVenueForm({ name: '', capacity: '', description: '', image: '', facilities: { ac: false, mic: false, projector: false } }); }}>Cancel</button>}
                        </form>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {venues.map(venue => (
                            <div key={venue._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4>{venue.name}</h4>
                                    <p style={{ color: 'var(--text-secondary)' }}>Cap: {venue.capacity}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                        {venue.facilities?.ac && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>AC</span>}
                                        {venue.facilities?.mic && <span style={{ background: '#fce7f3', color: '#be185d', padding: '2px 6px', borderRadius: '4px' }}>Mic</span>}
                                        {venue.facilities?.projector && <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>Projector</span>}
                                    </div>
                                </div>
                                <div>
                                    <button className="btn btn-secondary" style={{ marginRight: '0.5rem' }} onClick={() => handleEditVenue(venue)}>Edit</button>
                                    <button className="btn btn-danger" onClick={() => handleDeleteVenue(venue._id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'bookings' && (
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <a href="http://localhost:5000/api/bookings/download" target="_blank" rel="noopener noreferrer" className="btn btn-success" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Download CSV</span>
                        </a>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                        <thead style={{ background: '#f1f5f9' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Venue</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>User</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>When</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Purpose</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(booking => (
                                <tr key={booking._id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>{booking.venue?.name || 'Unknown'}</td>
                                    <td style={{ padding: '1rem' }}>{booking.user?.username || 'Unknown'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {new Date(booking.startTime).toLocaleString()} - <br />
                                        {new Date(booking.endTime).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{booking.purpose}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} onClick={() => handleDeleteBooking(booking._id)}>Cancel</button>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No bookings found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
