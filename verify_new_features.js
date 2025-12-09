const axios = require('axios');

async function test() {
    try {
        // 1. Login (User)
        console.log('--- Logging in ---');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'ranjith', // Assuming this user exists from previous steps or I'll create one
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login Success. Token obtained.');

        // 2. Get Profile
        console.log('\n--- Fetching Profile ---');
        const profileRes = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Profile Data:', profileRes.data);

        // 3. Get Bookings
        console.log('\n--- Fetching Bookings ---');
        const bookingsRes = await axios.get('http://localhost:5000/api/bookings', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Bookings Found:', bookingsRes.data.length);
        if (bookingsRes.data.length > 0) {
            console.log('First Booking Status:', bookingsRes.data[0].status);
        }

    } catch (error) {
        if (error.response) {
            console.error('Test Failed:', error.response.status, error.response.data);
            // If login fails, I might need to register first
            if (error.config.url.includes('login') && error.response.status === 400) {
                console.log('Login failed. Attempting Registration...');
                await registerAndRetry();
            }
        } else {
            console.error('Test Error:', error.message);
        }
    }
}

async function registerAndRetry() {
    try {
        await axios.post('http://localhost:5000/api/auth/register', {
            username: 'ranjith',
            password: 'password123',
            email: 'ranjithtest@example.com',
            role: 'user'
        });
        console.log('Registration Success. Retrying Test...');
        await test();
    } catch (e) {
        console.error('Registration Failed:', e.response ? e.response.data : e.message);
    }
}

test();
