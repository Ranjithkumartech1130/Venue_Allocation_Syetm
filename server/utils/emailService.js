const nodemailer = require('nodemailer');
if (!process.env.EMAIL_USER) {
    require('dotenv').config();
}

console.log('Email Service Initialized. User:', process.env.EMAIL_USER);

// Create a transporter with enhanced configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASS || 'password'
    },
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    pool: true, // Use connection pooling
    maxConnections: 5,
    maxMessages: 10,
    rateDelta: 1000, // 1 second between messages
    rateLimit: 5, // Max 5 messages per rateDelta
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000 // 60 seconds
});

const getAdminEmail = (level) => {
    switch (level) {
        case 1: return process.env.EMAIL_ADMIN_LEVEL_1 || 'level1@example.com';
        case 2: return process.env.EMAIL_ADMIN_LEVEL_2 || 'level2@example.com';
        case 3: return process.env.EMAIL_ADMIN_LEVEL_3 || 'level3@example.com';
        case 4: return process.env.EMAIL_ADMIN_LEVEL_4 || 'level4@example.com';
        default: return 'admin@example.com';
    }
};

exports.sendApprovalRequest = async (booking, venueName, level) => {

    const recipientEmail = getAdminEmail(level);

    // Customize subject/body based on level?
    const bookings = Array.isArray(booking) ? booking : [booking];

    // Safety check if bookings array is empty
    if (bookings.length === 0) return;

    const firstBooking = bookings[0]; // Use first booking for shared details like Time/Purpose/User
    // Assuming User and Venue models are accessible or passed
    // For this example, I'll mock them or assume they are imported
    // const User = require('../models/User'); // Example import
    // const Venue = require('../models/Venue'); // Example import
    const JsonDB = require('./jsonDb');
    const User = new JsonDB('users');
    const Venue = new JsonDB('venues');

    const user = User.findById(firstBooking.user);

    // Venues list for subject
    let subject = '';
    if (bookings.length === 1) {
        subject = `Approval Request (Level ${level}): ${venueName || 'Unknown Venue'}`;
    } else {
        subject = `Approval Request (Level ${level}): ${bookings.length} Venues`;
    }

    if (!process.env.EMAIL_USER) {
        console.log(`--- SIMULATED EMAIL TO LEVEL ${level} ADMIN ---`);
        console.log(`To: ${recipientEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`Venues: ${bookings.length}`);
        return;
    }

    // Generate HTML for Venues List
    let venuesHtml = '';
    if (bookings.length === 1) {
        const b = bookings[0];
        // Fetch venue name if not passed
        const vName = venueName || Venue.findById(b.venue)?.name;
        // Single venue layout (similar to old one but simplified)
        venuesHtml = `
            <p><strong>Venue:</strong> ${vName}</p>
            <div style="margin-top: 20px;">
                <a href="http://localhost:5000/api/bookings/verify/${b._id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve</a>
                <a href="http://localhost:5000/api/bookings/reject/${b._id}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reject</a>
            </div>
        `;
    } else {
        // Table for multiple venues - show both approved and rejected
        venuesHtml = `
            <h3>Requested Venues:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Venue</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Status</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(b => {
            const vName = Venue.findById(b.venue)?.name || 'Unknown';

            // Check if this venue was rejected
            if (b.status === 'cancelled' && b.rejectionReason) {
                return `
                        <tr style="background-color: #ffebee;">
                            <td style="padding: 10px; border: 1px solid #ddd; color: #c62828; font-weight: bold;">${vName}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                <div style="background-color: #f44336; color: white; padding: 5px 10px; border-radius: 3px; display: inline-block; font-size: 12px;">
                                    REJECTED
                                </div>
                                <div style="margin-top: 5px; font-size: 12px; color: #666;">
                                    <strong>Reason:</strong> ${b.rejectionReason}
                                </div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #999;">
                                Already Rejected
                            </td>
                        </tr>
                        `;
            } else {
                // Approved or pending venue
                return `
                        <tr style="background-color: #e8f5e9;">
                            <td style="padding: 10px; border: 1px solid #ddd;">${vName}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                <div style="background-color: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; display: inline-block; font-size: 12px;">
                                    PENDING APPROVAL
                                </div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                <a href="http://localhost:5000/api/bookings/verify/${b._id}" style="color: #4CAF50; font-weight: bold; margin-right: 15px; text-decoration: none;">Approve</a>
                                <a href="http://localhost:5000/api/bookings/reject/${b._id}" style="color: #f44336; font-weight: bold; text-decoration: none;">Reject</a>
                            </td>
                        </tr>
                        `;
            }
        }).join('')}
                </tbody>
            </table>
        `;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: subject,
        html: `
            <h2>Booking Approval Request (Level ${level})</h2>
            <p><strong>User:</strong> ${user ? user.username : 'Unknown'}</p>
            <p><strong>Email:</strong> ${user ? user.email : 'Unknown'}</p>
            <p><strong>Purpose:</strong> ${firstBooking.purpose}</p>
            <p><strong>Time:</strong> ${new Date(firstBooking.startTime).toLocaleString()} - ${new Date(firstBooking.endTime).toLocaleString()}</p>
            
            ${venuesHtml}

            <p>Please review the attached reasoning document.</p>
        `,
        attachments: [
            {
                filename: firstBooking.reasoningFileName,
                path: firstBooking.reasoningFile
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Approval request sent to Level ${level} Admin (${recipientEmail}).`);
    } catch (error) {
        console.error('Error sending approval email:', error);
    }
};

exports.sendRejectionNotification = async (userEmail, booking, venueName, reason, rejectionLevel = 1) => {
    // Logic to send rejection email to student
    if (!process.env.EMAIL_USER) {
        console.log(`--- SIMULATED STUDENT EMAIL ---`);
        console.log(`To: ${userEmail}`);
        console.log('Subject: Booking Rejected');
        console.log(`Your booking for ${venueName} has been rejected.`);
        console.log(`Rejected by: Level ${rejectionLevel} Admin`);
        console.log(`Reason: ${reason}`);
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Booking Rejected: ' + venueName,
        html: `
            <h3 style="color: #f44336;">Booking Rejected</h3>
            <p>Your booking for <strong>${venueName}</strong> has been rejected.</p>
            <p><strong>Date:</strong> ${new Date(booking.startTime).toLocaleString()}</p>
            <p><strong>Purpose:</strong> ${booking.purpose}</p>
            
            <div style="background-color: #fff3e0; padding: 15px; border-left: 5px solid #ff9800; margin: 15px 0;">
                <p style="margin: 0; font-weight: bold; color: #e65100;">Rejected By:</p>
                <p style="margin: 5px 0 0 0;">Level ${rejectionLevel} Admin</p>
            </div>

            <div style="background-color: #ffebee; padding: 15px; border-left: 5px solid #f44336; margin: 15px 0;">
                <p style="margin: 0; font-weight: bold; color: #b71c1c;">Reason for Rejection:</p>
                <p style="margin: 5px 0 0 0;">${reason || 'No reason provided.'}</p>
            </div>

            <p>Please contact the Level ${rejectionLevel} Admin or department for more details, or try booking a different venue/time.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Rejection notification sent to user (${userEmail}).`);
    } catch (error) {
        console.error('Error sending rejection notification:', error);
    }
};

exports.sendApprovalNotification = async (userEmail, booking, venueName) => {
    if (!process.env.EMAIL_USER) {
        console.log(`--- SIMULATED STUDENT EMAIL (APPROVAL) ---`);
        console.log(`To: ${userEmail}`);
        console.log('Subject: Booking Approved');
        console.log(`Your booking for ${venueName} has been approved.`);
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Booking Approved: ' + venueName,
        html: `
            <h3>Booking Approved!</h3>
            <p>Your booking for <strong>${venueName}</strong> has been confirmed.</p>
            <p><strong>Date/Time:</strong> ${new Date(booking.startTime).toLocaleString()} - ${new Date(booking.endTime).toLocaleString()}</p>
            <p><strong>Purpose:</strong> ${booking.purpose}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Approval notification sent to user (${userEmail}).`);
    } catch (error) {
        console.error('Error sending approval notification:', error);
    }
};

exports.sendVerificationEmail = async (booking, venueName) => {
    console.log(`--- SYSTEM TEST EMAIL ---`);
    console.log(`To: Configured Admin`);
    console.log(`Subject: System Test - ${venueName}`);
    console.log(`Purpose: ${booking.purpose}`);

    if (!process.env.EMAIL_USER) {
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self for test
        subject: `System Test: ${venueName}`,
        html: `
            <h3>System Connectivity Test</h3>
            <p><strong>Venue:</strong> ${venueName}</p>
            <p><strong>Purpose:</strong> ${booking.purpose}</p>
            <p><strong>Time:</strong> ${booking.startTime.toString()}</p>
            <p>System email functionality is working.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Test email sent successfully.');
    } catch (error) {
        console.error('Error sending test email:', error);
        throw error;
    }
};
