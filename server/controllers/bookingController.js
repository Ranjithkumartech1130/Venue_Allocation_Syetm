const JsonDB = require('../utils/jsonDb');
const Booking = new JsonDB('bookings');
const Venue = new JsonDB('venues');
const User = new JsonDB('users');
const { sendRejectionNotification, sendApprovalNotification, sendApprovalRequest } = require('../utils/emailService');

exports.createBooking = async (req, res) => {
    try {
        console.log('[DEBUG] createBooking called');
        console.log('[DEBUG] req.body:', req.body);
        console.log('[DEBUG] req.file:', req.file);

        const { venue, startTime, endTime, purpose } = req.body;

        // Check if file was uploaded
        if (!req.file) {
            console.log('[ERROR] No file uploaded');
            return res.status(400).json({ message: 'Reasoning file is required' });
        }

        console.log('[DEBUG] File uploaded:', req.file.originalname);

        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        // Check for conflicts
        console.log('[DEBUG] Checking for conflicts...');
        const allBookings = Booking.find({ venue });
        const conflict = allBookings.find(b => {
            if (b.status === 'cancelled') return false;
            const startA = new Date(b.startTime);
            const endA = new Date(b.endTime);
            const startB = new Date(startTime);
            const endB = new Date(endTime);
            return (startA < endB && endA > startB);
        });

        if (conflict) {
            if (conflict.status === 'confirmed') {
                return res.status(400).json({ message: 'Venue is already booked for this time slot' });
            } else if (conflict.status.startsWith('pending')) {
                return res.status(400).json({ message: 'A pending booking already exists for this slot.' });
            }
        }

        console.log('[DEBUG] Creating booking...');
        const booking = Booking.create({
            user: req.user.id,
            venue,
            startTime,
            endTime,
            purpose,
            reasoningFile: req.file.path,
            reasoningFileName: req.file.originalname,
            status: 'pending_level_1', // Start at Level 1
            approvalLevel: 1
        });

        console.log('[DEBUG] Booking created:', booking._id);

        // Send Email to Level 1 Admin
        console.log('[DEBUG] Sending email to Level 1 Admin...');
        const venueData = Venue.findById(venue);
        // Using generic sendApprovalRequest
        // Requires importing it properly, see updated import below
        const { sendApprovalRequest } = require('../utils/emailService');
        await sendApprovalRequest(booking, venueData ? venueData.name : 'Unknown Venue', 1);

        console.log('[DEBUG] Email sent successfully');
        res.status(201).json({ ...booking, message: 'Booking pending Level 1 approval.' });
    } catch (error) {
        console.error('[ERROR] Error in createBooking:', error);
        console.error('[ERROR] Stack trace:', error.stack);
        res.status(500).json({ message: 'Error creating booking', error: error.message });
    }
};

exports.verifyBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = Booking.findById(id);

        if (!booking) return res.send('<h1>Booking Not Found</h1>');
        if (booking.status === 'confirmed') return res.send('<h1>Booking Already Verified!</h1>');

        let currentLevel = booking.approvalLevel || 1;

        if (currentLevel < 4) {
            // Move to next level
            const nextLevel = currentLevel + 1;

            Booking.update(id, {
                status: `pending_level_${nextLevel}`,
                approvalLevel: nextLevel
            });

            // Convert to updated object for email (JsonDB update returns updated obj or we just use ID)
            // We'll trust the update and re-fetch or modify local obj
            booking.status = `pending_level_${nextLevel}`;
            booking.approvalLevel = nextLevel;

            const venue = Venue.findById(booking.venue);
            const { sendApprovalRequest } = require('../utils/emailService');
            await sendApprovalRequest(booking, venue ? venue.name : 'Unknown Venue', nextLevel);

            res.send(`
                <div style="font-family: Arial; text-align: center; margin-top: 50px;">
                    <h1 style="color: green;">Level ${currentLevel} Approved!</h1>
                    <p>Booking has been forwarded to Level ${nextLevel} Admin for approval.</p>
                </div>
             `);
        } else {
            // Final Approval (Level 4 -> Confirmed)
            Booking.update(id, { status: 'confirmed' });

            // Notify User
            const user = User.findById(booking.user);
            const venue = Venue.findById(booking.venue);
            const { sendApprovalNotification } = require('../utils/emailService');

            if (user && user.email) {
                await sendApprovalNotification(user.email, booking, venue ? venue.name : 'Unknown Venue');
            }

            res.send(`
                <div style="font-family: Arial; text-align: center; margin-top: 50px;">
                    <h1 style="color: green;">Final Approval Successful!</h1>
                    <p>The venue has been fully confirmed for the user.</p>
                </div>
            `);
        }
    } catch (error) {
        console.error('Error verifying booking:', error);
        res.status(500).send('<h1>Server Error Verifying Booking</h1>');
    }
};

exports.rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = Booking.findById(id);

        if (!booking) return res.send('<h1>Booking Not Found</h1>');
        if (booking.status === 'confirmed') return res.send('<h1>Booking Already Verified! Cannot Reject.</h1>');
        if (booking.status === 'cancelled') return res.send('<h1>Booking Already Rejected/Cancelled!</h1>');

        // Update status
        Booking.update(id, { status: 'cancelled' });

        // Notify User
        const user = User.findById(booking.user);
        const venue = Venue.findById(booking.venue);
        if (user && user.email) {
            await sendRejectionNotification(user.email, booking, venue ? venue.name : 'Unknown Venue');
        }

        res.send(`
            <div style="font-family: Arial; text-align: center; margin-top: 50px;">
                <h1 style="color: red;">Booking Rejected</h1>
                <p>The booking has been marked as cancelled.</p>
                <p>An email notification has been sent to the user.</p>
            </div>
        `);
    } catch (error) {
        res.status(500).send('<h1>Server Error Rejecting Booking</h1>');
    }
};

exports.getBookings = async (req, res) => {
    try {
        let bookings = Booking.find();
        console.log(`[DEBUG] Found ${bookings.length} total bookings.`);

        // Filter by user if not admin
        if (req.user.role !== 'admin') {
            console.log(`[DEBUG] Filtering for user: ${req.user.id}`);
            bookings = bookings.filter(b => String(b.user) === String(req.user.id));
            console.log(`[DEBUG] Found ${bookings.length} bookings for user.`);
        }

        // Populate helper
        const populatedBookings = bookings.map(b => {
            const user = User.findById(b.user);
            const venue = Venue.findById(b.venue);
            return {
                ...b,
                user: user ? { username: user.username } : null,
                venue: venue ? { name: venue.name } : null
            };
        });

        res.json(populatedBookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings' });
    }
};

exports.getVenueBookings = async (req, res) => {
    try {
        const { venueId } = req.params;
        const bookings = Booking.find({ venue: venueId, status: 'confirmed' });

        const populatedBookings = bookings.map(b => {
            const user = User.findById(b.user);
            return { ...b, user: user ? { username: user.username } : null };
        });

        res.json(populatedBookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching venue bookings' });
    }
}


exports.deleteBooking = async (req, res) => {
    try {
        const booking = Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.user !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Send cancellation email if admin is cancelling (or even user, but typically admin)
        // If it's the admin cancelling someone else's booking, notify the user.
        if (req.user.role === 'admin' && booking.user !== req.user.id) {
            const user = User.findById(booking.user);
            const venue = Venue.findById(booking.venue);
            if (user && user.email) {
                await sendRejectionNotification(user.email, booking, venue ? venue.name : 'Unknown Venue');
            }
        }

        Booking.delete(req.params.id);
        res.json({ message: 'Booking cancelled' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling booking' });
    }
};
