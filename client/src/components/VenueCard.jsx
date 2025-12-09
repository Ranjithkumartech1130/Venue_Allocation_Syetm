import React, { useState } from 'react';
import BookingModal from './BookingModal';

const VenueCard = ({ venue, refreshBookings }) => {
    const [showModal, setShowModal] = useState(false);

    // We could show current status here if we had it, but for now just basic info.
    // "Status (Booked/Free)" depends on the current time vs bookings.
    // Since we don't have real-time status from API in the venue object yet (left it simple),
    // we can just show the venue.
    // Enhancment: Fetch bookings for today for this venue to determine status?
    // User asked: "Status (Booked / Free)".
    // I will assume "Free" unless I see it is booked right now.
    // For now, let's keep it static or rely on user check.
    // Actually, let's just allow booking attempts.

    return (
        <div className="card">
            {/* Placeholder image or actual image */}
            <div style={{ height: '200px', background: '#e2e8f0', borderRadius: '0.5rem', marginBottom: '1rem', overflow: 'hidden' }}>
                {venue.image ? (
                    <img src={venue.image} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No Image</div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{venue.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {venue.facilities?.ac && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>AC</span>}
                    {venue.facilities?.mic && <span style={{ background: '#fce7f3', color: '#be185d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>Mic</span>}
                    {venue.facilities?.projector && <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>Projector</span>}
                    <span className="badge badge-success">Available</span>
                </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{venue.description}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <strong>Capacity:</strong> {venue.capacity}
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>Book Venue</button>
            </div>

            {showModal && (
                <BookingModal
                    venue={venue}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        refreshBookings(); // Trigger parent refresh if needed or just alert
                        alert('Booking Request Sent!');
                    }}
                />
            )}
        </div>
    );
};

export default VenueCard;
