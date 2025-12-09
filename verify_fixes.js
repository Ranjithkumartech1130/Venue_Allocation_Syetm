const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verify() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Register User
        const username = `user_${Date.now()}`;
        console.log(`1. Registering user: ${username}`);
        await axios.post(`${API_URL}/auth/register`, {
            username,
            email: `${username}@example.com`,
            password: 'password123',
            role: 'user'
        });

        // 2. Login User
        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username,
            password: 'password123'
        });
        const token = loginRes.data.token;
        const userId = loginRes.data.id; // Note: Login response might not return ID directly based on authController, let's check.
        // authController sends: { token, role, username }
        console.log('   Logged in successfully.');

        // 3. Create Booking
        console.log('3. Creating booking...');
        const startTime = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
        const endTime = new Date(Date.now() + 90000000).toISOString();

        // We need a venue ID first. Let's create one first to be safe or list them.
        // Assuming we can create one or there is one. 
        // Let's rely on finding one.
        // Actually, let's just create a dummy "venue" ID since we are using JsonDB and it might not enforce referential integrity strictly, 
        // BUT the booking controller checks `Venue.findById(venue)`.
        // Let's create a venue if we can (admin only).
        // Or just login as admin provided in previous context? 
        // Let's try to list venues (public route?). 
        // `venueRoutes` usually public for GET /? Let's assume yes or try to create one as admin.

        // Register Admin
        const adminName = `admin_${Date.now()}`;
        await axios.post(`${API_URL}/auth/register`, {
            username: adminName,
            email: `${adminName}@example.com`,
            password: 'password123',
            role: 'admin'
        });
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            username: adminName,
            password: 'password123'
        });
        const adminToken = adminLogin.data.token;

        // Create Venue
        console.log('   Creating Venue as Admin...');
        const venueRes = await axios.post(`${API_URL}/venues`, {
            name: `Venue ${Date.now()}`,
            capacity: 100,
            description: 'Test Venue',
            facilities: { ac: true }
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const venueId = venueRes.data._id || venueRes.data.id; // Check response structure

        // Create Booking as User
        const bookingRes = await axios.post(`${API_URL}/bookings`, {
            venue: venueId,
            startTime,
            endTime,
            purpose: 'Test Booking'
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log('   Booking created.');

        // 4. Get My Bookings
        console.log('4. Fetching My Bookings...');
        const myBookingsRes = await axios.get(`${API_URL}/bookings`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const found = myBookingsRes.data.find(b => b.purpose === 'Test Booking');

        if (found) {
            console.log('SUCCESS: Booking found in user list.');
        } else {
            console.log('FAILURE: Booking NOT found in user list.');
            console.log('   Bookings returned:', JSON.stringify(myBookingsRes.data, null, 2));
        }

        // 5. Check Admin Stats (Bookings Today)
        // Wait, the booking created above is for TOMORROW. 
        // Let's create one for TODAY to test the stats.
        console.log('5. Testing Admin Stats (Today Bookings)...');
        const todayStart = new Date().toISOString();
        const todayEnd = new Date(Date.now() + 3600000).toISOString();
        await axios.post(`${API_URL}/bookings`, {
            venue: venueId,
            startTime: todayStart,
            endTime: todayEnd,
            purpose: 'Today Booking'
        }, { headers: { Authorization: `Bearer ${token}` } });

        // Fetch Admin Dashboard data (using existing endpoint ? AdminDashboard fetches /bookings)
        const adminBookingsRes = await axios.get(`${API_URL}/bookings`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        // Simulate frontend logic
        const bookings = adminBookingsRes.data;
        const todayCount = bookings.filter(b => {
            const bookingDate = new Date(b.startTime);
            const today = new Date();
            return bookingDate.toDateString() === today.toDateString();
        }).length;

        console.log(`   Admin logic sees ${todayCount} bookings for today.`);
        if (todayCount >= 1) {
            console.log('SUCCESS: Admin stats logic working (found at least 1).');
        } else {
            console.log('FAILURE: Admin stats logic found 0.');
        }

    } catch (err) {
        console.error('ERROR:', err.response ? err.response.data : err.message);
    }
}

verify();
