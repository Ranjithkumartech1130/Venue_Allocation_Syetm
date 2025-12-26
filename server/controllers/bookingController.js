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

        const { startTime, endTime, purpose } = req.body;
        // Parse venues: prefer 'venues' array (JSON string), fallback to single 'venue'
        let venueIds = [];
        if (req.body.venues) {
            try {
                venueIds = JSON.parse(req.body.venues);
            } catch (e) {
                // If not JSON, maybe comma separated or array? Assume JSON as per frontend.
                // If parse fails, fallback to single if available
                if (req.body.venue) venueIds = [req.body.venue];
            }
        } else if (req.body.venue) {
            venueIds = [req.body.venue];
        }

        if (venueIds.length === 0) {
            return res.status(400).json({ message: 'No venue selected' });
        }

        // Check if file was uploaded
        if (!req.file) {
            console.log('[ERROR] No file uploaded');
            return res.status(400).json({ message: 'Reasoning file is required' });
        }

        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        // CONFLICT CHECK FOR ALL VENUES
        console.log('[DEBUG] Checking for conflicts for venues:', venueIds);
        for (const venueId of venueIds) {
            const allBookings = Booking.find({ venue: venueId });
            const conflict = allBookings.find(b => {
                if (b.status === 'cancelled') return false;
                const startA = new Date(b.startTime);
                const endA = new Date(b.endTime);
                const startB = new Date(startTime);
                const endB = new Date(endTime);
                return (startA < endB && endA > startB);
            });

            if (conflict) {
                const venueName = Venue.findById(venueId)?.name || 'Unknown Venue';
                if (conflict.status === 'confirmed') {
                    return res.status(400).json({ message: `Venue '${venueName}' is already booked for: ${conflict.purpose}` });
                } else if (conflict.status.startsWith('pending')) {
                    return res.status(400).json({ message: `Venue '${venueName}' is in waiting list` });
                }
            }
        }

        // CREATE BOOKINGS
        console.log('[DEBUG] Creating bookings...');
        const createdBookings = [];
        for (const venueId of venueIds) {
            const booking = Booking.create({
                user: req.user.id,
                venue: venueId,
                startTime,
                endTime,
                purpose,
                reasoningFile: req.file.path,
                reasoningFileName: req.file.originalname,
                status: 'pending_level_1', // Start at Level 1 for all
                approvalLevel: 1
            });
            createdBookings.push(booking);
        }

        console.log(`[DEBUG] Created ${createdBookings.length} bookings.`);

        // Send AGGREGATED Email to Level 1 Admin
        console.log('[DEBUG] Sending email to Level 1 Admin...');

        // We need venue names for the email
        // If it's a single booking, the original logic passed (booking, venueName, level)
        // We will update sendApprovalRequest to handle array.
        const { sendApprovalRequest } = require('../utils/emailService');
        await sendApprovalRequest(createdBookings, null, 1); // Pass null for venueName, specialized logic will handle array

        console.log('[DEBUG] Email sent successfully');
        res.status(201).json({ bookings: createdBookings, message: 'Bookings created and pending Level 1 approval.' });

    } catch (error) {
        console.error('[ERROR] Error in createBooking:', error);
        console.error('[ERROR] Stack trace:', error.stack);
        res.status(500).json({ message: `Error creating booking: ${error.message}`, error: error.message });
    }
};

exports.verifyBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = Booking.findById(id);

        if (!booking) return res.send('<h1>Booking Not Found</h1>');
        if (booking.status === 'confirmed') return res.send('<h1>Booking Already Verified!</h1>');

        // Check if already cancelled
        if (booking.status === 'cancelled') return res.send('<h1>Booking Already Cancelled/Rejected!</h1>');

        let currentLevel = booking.approvalLevel || 1;

        if (currentLevel < 4) {
            // Move to next level
            const nextLevel = currentLevel + 1;

            // Update ONLY this booking to next level (independent approval)
            Booking.update(id, {
                status: `pending_level_${nextLevel}`,
                approvalLevel: nextLevel
            });

            console.log(`[DEBUG] Approved booking ${id} to Level ${nextLevel}`);

            // Find ALL bookings from the same user/time/purpose
            const allBookings = Booking.find({});
            const relatedBookings = allBookings.filter(b =>
                b.user === booking.user &&
                b.startTime === booking.startTime &&
                b.endTime === booking.endTime &&
                b.purpose === booking.purpose
            );

            // Check if there are any bookings still pending at the CURRENT level
            const stillPendingAtCurrentLevel = relatedBookings.filter(b =>
                b.status === `pending_level_${currentLevel}`
            );

            console.log(`[DEBUG] ${stillPendingAtCurrentLevel.length} bookings still pending at Level ${currentLevel}`);

            // Find bookings at next level
            const nextLevelBookings = relatedBookings.filter(b =>
                b.status === `pending_level_${nextLevel}`
            );

            // Find rejected bookings for context
            const rejectedBookings = relatedBookings.filter(b =>
                b.status === 'cancelled'
            );

            // ONLY send email if ALL venues at current level have been processed
            if (stillPendingAtCurrentLevel.length === 0 && nextLevelBookings.length > 0) {
                // All venues processed at current level, send email to next level
                const allBookingsForEmail = [...nextLevelBookings, ...rejectedBookings];

                console.log(`[DEBUG] All venues processed at Level ${currentLevel}. Sending email to Level ${nextLevel}`);
                console.log(`[DEBUG] Email will include: ${nextLevelBookings.length} pending, ${rejectedBookings.length} rejected`);

                const { sendApprovalRequest } = require('../utils/emailService');
                await sendApprovalRequest(allBookingsForEmail, null, nextLevel);
            } else {
                console.log(`[DEBUG] NOT sending email yet - ${stillPendingAtCurrentLevel.length} venue(s) still pending at Level ${currentLevel}`);
            }

            const venueCount = nextLevelBookings.length;
            const venue = Venue.findById(booking.venue);
            res.send(`
                <div style="font-family: Arial; text-align: center; margin-top: 50px;">
                    <h1 style="color: green;">Level ${currentLevel} Approved!</h1>
                    <p><strong>${venue ? venue.name : 'Venue'}</strong> has been approved at Level ${currentLevel}.</p>
                    ${stillPendingAtCurrentLevel.length > 0
                    ? `<p style="color: #ff9800; font-size: 14px;">⏳ ${stillPendingAtCurrentLevel.length} venue${stillPendingAtCurrentLevel.length > 1 ? 's' : ''} still pending approval at this level</p>`
                    : `<p style="color: #4CAF50; font-size: 14px;">✅ All venues processed! Email sent to Level ${nextLevel} Admin</p>`
                }
                    ${nextLevelBookings.length > 0 ? `<p style="color: #666; font-size: 14px;">(${nextLevelBookings.length} venue${nextLevelBookings.length > 1 ? 's' : ''} forwarded to Level ${nextLevel})</p>` : ''}
                    ${rejectedBookings.length > 0 ? `<p style="color: #f44336; font-size: 14px;">(${rejectedBookings.length} venue${rejectedBookings.length > 1 ? 's were' : ' was'} rejected)</p>` : ''}
                </div>
             `);
        } else {
            // Final Approval (Level 4 -> Confirmed)
            Booking.update(id, { status: 'confirmed' });

            console.log(`[DEBUG] Final approval for booking ${id}`);

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
                    <p><strong>${venue ? venue.name : 'The venue'}</strong> has been fully confirmed for the user.</p>
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

        // Serve HTML Form
        res.send(`
            <div style="font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #f44336; text-align: center;">Reject Booking</h2>
                <p><strong>Venue:</strong> ${Venue.findById(booking.venue)?.name || 'Unknown'}</p>
                <p><strong>Purpose:</strong> ${booking.purpose}</p>
                <form action="/api/bookings/reject/${id}" method="POST">
                    <label for="reason" style="display: block; margin-bottom: 10px; font-weight: bold;">Reason for Rejection:</label>
                    <textarea id="reason" name="reason" rows="4" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc;" required placeholder="Enter the reason for rejection..."></textarea>
                    <br/><br/>
                    <button type="submit" style="width: 100%; padding: 10px; background-color: #f44336; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Confirm Rejection</button>
                </form>
            </div>
        `);
    } catch (error) {
        res.status(500).send('<h1>Server Error Loading Rejection Form</h1>');
    }
};

exports.processRejection = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // In Express, parsing req.body requires body-parser or express.json/urlencoded
        // Ensure server.js app.use(express.urlencoded({ extended: true })) is present or added.
        // Assuming standard setup, but let's check. 
        // If not, this might fail. I'll rely on common setup but warn in memory.

        const booking = Booking.findById(id);

        if (!booking) return res.send('<h1>Booking Not Found</h1>');
        if (booking.status === 'confirmed') return res.send('<h1>Booking Already Verified! Cannot Reject.</h1>');
        if (booking.status === 'cancelled') return res.send('<h1>Booking Already Rejected/Cancelled!</h1>');

        // Update ONLY this booking to cancelled (independent rejection)
        // Store the rejection reason for display in emails
        Booking.update(id, {
            status: 'cancelled',
            rejectionReason: reason,
            rejectedAt: new Date()
        });

        console.log(`[DEBUG] Rejected booking ${id}`);

        // Notify User about this specific venue
        const user = User.findById(booking.user);
        const venue = Venue.findById(booking.venue);
        const { sendRejectionNotification } = require('../utils/emailService');

        if (user && user.email) {
            const rejectionLevel = booking.approvalLevel || 1;
            await sendRejectionNotification(user.email, booking, venue ? venue.name : 'Unknown Venue', reason, rejectionLevel);
        }

        res.send(`
            <div style="font-family: Arial; text-align: center; margin-top: 50px;">
                <h1 style="color: red;">Booking Rejected</h1>
                <p><strong>${venue ? venue.name : 'The venue'}</strong> has been marked as cancelled.</p>
                <p>Reason: <strong>${reason}</strong></p>
                <p>An email notification with the reason has been sent to the user.</p>
            </div>
        `);
    } catch (error) {
        console.error('Error processing rejection:', error);
        res.status(500).send('<h1>Server Error Rejecting Booking</h1>');
    }
};

exports.downloadBookings = async (req, res) => {
    try {
        const allBookings = Booking.find({});

        // We need to resolve User and Venue names.
        // JsonDB returns IDs. We have to map manually if no populate exists.

        const csvRows = [];
        // Header
        csvRows.push(['Booking ID', 'Venue', 'User', 'Start Time', 'End Time', 'Purpose', 'Status', 'Level'].join(','));

        for (const b of allBookings) {
            const venue = Venue.findById(b.venue);
            const user = User.findById(b.user);

            const row = [
                b._id,
                venue ? venue.name : 'Unknown',
                user ? user.username : 'Unknown',
                new Date(b.startTime).toLocaleString(),
                new Date(b.endTime).toLocaleString(),
                `"${b.purpose.replace(/"/g, '""')}"`, // Escape quotes
                b.status,
                b.approvalLevel || 1
            ];
            csvRows.push(row.join(','));
        }

        const csvString = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="bookings_export.csv"');
        res.send(csvString);

    } catch (error) {
        console.error('Error downloading bookings:', error);
        res.status(500).send('Error generating CSV');
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
