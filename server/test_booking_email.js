const axios = require('axios');

async function testBookingEmail() {
    try {
        console.log('--- Testing Booking Email Trigger ---');
        // 1. Login as Admin to get token (or use any user)
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Logged in as Admin.');

        // 2. Get Venues
        const venuesRes = await axios.get('http://localhost:5000/api/venues', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const venue = venuesRes.data[0];
        console.log(`Booking venue: ${venue.name}`);

        // 3. Create Booking
        // Random date to avoid conflict
        const randomDay = Math.floor(Math.random() * 20) + 10;
        const bookingRes = await axios.post('http://localhost:5000/api/bookings', {
            venue: venue._id,
            startTime: `2025-12-${randomDay}T10:00:00.000Z`,
            endTime: `2025-12-${randomDay}T12:00:00.000Z`,
            purpose: 'Email Test Booking'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Booking response:', bookingRes.data);
        console.log('If successful, check the server console for "Verification email sent..."');

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

testBookingEmail();
