import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import VenueCard from '../components/VenueCard';

const Dashboard = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter venues based on search query
    const filteredVenues = venues.filter(venue => {
        const query = searchQuery.toLowerCase();
        const matchesName = venue.name?.toLowerCase().includes(query);
        const matchesDescription = venue.description?.toLowerCase().includes(query);
        const matchesCapacity = venue.capacity?.toString().includes(query);
        const matchesFacilities =
            (venue.facilities?.ac && 'ac'.includes(query)) ||
            (venue.facilities?.mic && 'mic'.includes(query)) ||
            (venue.facilities?.projector && 'projector'.includes(query));

        return matchesName || matchesDescription || matchesCapacity || matchesFacilities;
    });

    if (loading) return <div className="container" style={{ textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container">
            <h1 style={{ marginBottom: '1.5rem' }}>Available Venues</h1>

            {/* Search Bar with Unique Design */}
            <div style={{
                marginBottom: '2rem',
                position: 'relative',
            }}>
                <div style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                    borderRadius: '1rem',
                    padding: '0.5rem',
                    backdropFilter: 'blur(10px)',
                    boxShadow: searchQuery ? '0 8px 32px rgba(99, 102, 241, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    backgroundImage: searchQuery
                        ? 'linear-gradient(white, white), linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                        : 'linear-gradient(white, white), linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                }}>
                    {/* Search Icon */}
                    <div style={{
                        position: 'absolute',
                        left: '1.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: searchQuery ? '#6366f1' : '#94a3b8',
                        transition: 'color 0.3s ease',
                        fontSize: '1.25rem',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}>
                        🔍
                    </div>

                    <input
                        type="text"
                        placeholder="Search venues by name, facilities, capacity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 3.5rem 1rem 3.5rem',
                            fontSize: '1rem',
                            border: 'none',
                            borderRadius: '0.75rem',
                            outline: 'none',
                            background: 'white',
                            color: '#1e293b',
                            fontWeight: '500',
                            transition: 'all 0.3s ease',
                        }}
                    />

                    {/* Clear Button */}
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '1.5rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '2rem',
                                height: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                zIndex: 1,
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-50%) scale(1.1)';
                                e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(-50%) scale(1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Search Results Counter */}
                {searchQuery && (
                    <div style={{
                        marginTop: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        animation: 'fadeIn 0.3s ease',
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                        }}>
                            {filteredVenues.length}
                        </div>
                        <p style={{
                            margin: 0,
                            color: '#64748b',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                        }}>
                            venue{filteredVenues.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                )}
            </div>

            {filteredVenues.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {searchQuery ? 'No venues match your search.' : 'No venues found.'}
                </p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {filteredVenues.map(venue => (
                        <VenueCard key={venue._id} venue={venue} availableVenues={venues} refreshBookings={fetchVenues} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
