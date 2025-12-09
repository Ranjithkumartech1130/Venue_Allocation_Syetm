require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const venueRoutes = require('./routes/venueRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data dir exists
const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
    res.send('Venue Allocation API (JSON Mode) is running');
});

// Test Email Route
const { sendVerificationEmail } = require('./utils/emailService');
app.get('/api/test-email', async (req, res) => {
    try {
        console.log('Manual Test Email Triggered');
        await sendVerificationEmail({
            _id: 'TEST_ID',
            startTime: new Date(),
            endTime: new Date(),
            purpose: 'Manual System Test'
        }, 'TEST VENUE');
        res.send('Test Email Sent! Check your console and inbox.');
    } catch (error) {
        res.status(500).send('Error sending email: ' + error.message);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
