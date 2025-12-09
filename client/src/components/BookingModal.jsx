import React, { useState } from 'react';
import api from '../api/axios';

const BookingModal = ({ venue, onClose, onSuccess }) => {
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [purpose, setPurpose] = useState('');
    const [reasoningFile, setReasoningFile] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (file.type !== 'application/pdf') {
                setError('Only PDF files are allowed');
                e.target.value = '';
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                e.target.value = '';
                return;
            }
            setReasoningFile(file);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!startDate || !startTime || !endDate || !endTime || !purpose) {
            setError('All fields are required');
            return;
        }

        if (!reasoningFile) {
            setError('Reasoning file is required');
            return;
        }

        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);

        if (start >= end) {
            setError('End time must be after start time');
            return;
        }

        if (start < new Date()) {
            setError('Booking cannot be in the past');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('venue', venue._id);
            formData.append('startTime', start.toISOString());
            formData.append('endTime', end.toISOString());
            formData.append('purpose', purpose);
            formData.append('reasoningFile', reasoningFile);

            await api.post('/bookings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Book {venue.name}</h3>
                    <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>X</button>
                </div>

                {error && <div className="badge badge-danger" style={{ marginBottom: '1rem', display: 'block', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>From Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>From Time</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>To Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>To Time</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Reasoning Document (PDF) *</label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            required
                        />
                        {reasoningFile && (
                            <small style={{ color: '#4CAF50', marginTop: '0.5rem', display: 'block' }}>
                                ✓ {reasoningFile.name} ({(reasoningFile.size / 1024).toFixed(2)} KB)
                            </small>
                        )}
                    </div>

                    <div className="input-group">
                        <label>Purpose</label>
                        <textarea rows="3" value={purpose} onChange={e => setPurpose(e.target.value)} required placeholder="Event description..."></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Confirm Booking</button>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;
