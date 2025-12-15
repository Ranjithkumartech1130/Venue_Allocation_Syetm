const { sendApprovalRequest } = require('./utils/emailService');
const JsonDB = require('./utils/jsonDb');

// Load environment variables
require('dotenv').config();

// Initialize DBs
const User = new JsonDB('users');
const Venue = new JsonDB('venues');
const Booking = new JsonDB('bookings');

async function testEmail() {
    console.log('--- STARTING MANUAL EMAIL TEST ---');

    // 1. Get a real user and venue
    const users = User.read();
    const venues = Venue.read();

    if (users.length === 0 || venues.length === 0) {
        console.error('ERROR: No users or venues found in database to test with.');
        return;
    }

    const testUser = users[0];
    const testVenue = venues[0];

    console.log(`Using User: ${testUser.username} (ID: ${testUser._id})`);
    console.log(`Using Venue: ${testVenue.name} (ID: ${testVenue._id})`);

    // 2. Create a dummy booking object (in memory, not saving to DB)
    const mockBooking = {
        _id: 'TEST_BOOKING_ID_' + Date.now(),
        user: testUser._id,
        venue: testVenue._id,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        purpose: 'Manual Test of Email Service',
        reasoningFileName: 'test_file.pdf',
        reasoningFile: 'path/to/test_file.pdf',
        status: 'pending_level_1',
        approvalLevel: 1
    };

    console.log('Mock Booking created:', mockBooking);

    // 3. Trigger email service
    const fs = require('fs');
    try {
        await sendApprovalRequest(mockBooking, testVenue.name, 1);
        const msg = 'SUCCESS: Email function executed without error.\nUser: ' + testUser.username + '\nVenue: ' + testVenue.name;
        fs.writeFileSync('result.txt', msg);
        console.log(msg);
    } catch (error) {
        const msg = 'FAILURE: Email function threw an error: ' + error.message + '\n' + error.stack;
        fs.writeFileSync('result.txt', msg);
        console.error(msg);
    }
}

testEmail();
