const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const client = axios.create({ baseURL: API_URL });

const runTest = async () => {
    try {
        console.log('--- Starting System Test (JSON DB) ---');

        // 1. Register User
        const username = `json_user_${Date.now()}`;
        const email = `${username}@example.com`;
        console.log(`Registering user: ${username}`);

        await client.post('/auth/register', {
            username,
            password: 'password123',
            email,
            role: 'user'
        });

        // 2. Login
        console.log('Logging in...');
        const loginRes = await client.post('/auth/login', {
            username,
            password: 'password123'
        });
        const { token } = loginRes.data;
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Login successful.');

        // 3. Get Venues
        console.log('Fetching venues...');
        const venuesRes = await client.get('/venues');
        let venue = venuesRes.data[0];

        if (!venue) {
            console.log('No venues found. Seeding failed?');
            return;
        }
        console.log(`Selected venue: ${venue.name}`);

        // 4. Create Booking
        const today = new Date().toISOString().split('T')[0];
        console.log('Creating Booking...');
        await client.post('/bookings', {
            venue: venue._id,
            startTime: `${today}T10:00:00.000Z`,
            endTime: `${today}T12:00:00.000Z`,
            purpose: 'Test Event JSON'
        });
        console.log('Booking Created (PASSED).');

        console.log('--- Test Completed Successfully ---');

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
};

runTest();
