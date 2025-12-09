const nodemailer = require('nodemailer');
if (!process.env.EMAIL_USER) {
    require('dotenv').config();
}

console.log('Email Service Initialized. User:', process.env.EMAIL_USER);

// Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASS || 'password'
    },
    tls: {
        rejectUnauthorized: false
    }
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
    const approvalLink = `http://127.0.0.1:5000/api/bookings/verify/${booking._id}`;
    const rejectionLink = `http://127.0.0.1:5000/api/bookings/reject/${booking._id}`;
    const recipientEmail = getAdminEmail(level);

    // Customize subject/body based on level?
    const roleName = level === 1 ? 'HOD' : `Level ${level} Admin`;

    // If no real credentials, we just simulate
    if (!process.env.EMAIL_USER) {
        console.log(`--- EMAIL SIMULATION (Level ${level} Approval) ---`);
        console.log(`To: ${recipientEmail} (${roleName})`);
        console.log(`Subject: Action Required: Level ${level} Venue Booking Approval`);
        console.log(`Body: A new booking for ${venueName} requires your approval.`);
        console.log(`Approve: ${approvalLink}`);
        console.log(`Reject: ${rejectionLink}`);
        console.log(`Attachment: ${booking.reasoningFileName}`);
        console.log('------------------------');
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: `Action Required: Level ${level} Venue Booking Approval`,
        html: `
            <h3>New Booking Request - Level ${level} Approval</h3>
            <p><strong>Venue:</strong> ${venueName}</p>
            <p><strong>Date/Time:</strong> ${new Date(booking.startTime).toLocaleString()} - ${new Date(booking.endTime).toLocaleString()}</p>
            <p><strong>Purpose:</strong> ${booking.purpose}</p>
            <p><strong>Reasoning Document:</strong> Attached (${booking.reasoningFileName})</p>
            <br/>
            <p>Please review the attached document and approve or reject this booking.</p>
            <a href="${approvalLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve Booking</a>
            <a href="${rejectionLink}" style="padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">Reject Booking</a>
            <br/><br/>
            <p>This is level ${level} of 4 in the approval process.</p>
        `,
        attachments: [
            {
                filename: booking.reasoningFileName || 'reasoning-document.pdf',
                path: booking.reasoningFile // Ensure this path is correct from booking object
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${roleName} (${recipientEmail}).`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

exports.sendRejectionNotification = async (userEmail, booking, venueName) => {
    // Logic to send rejection email to student
    if (!process.env.EMAIL_USER) {
        console.log(`--- SIMULATED STUDENT EMAIL ---`);
        console.log(`To: ${userEmail}`);
        console.log('Subject: Booking Rejected');
        console.log(`Your booking for ${venueName} has been rejected.`);
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Booking Rejected: ' + venueName,
        html: `
            <h3>Booking Rejected</h3>
            <p>Your booking for <strong>${venueName}</strong> has been rejected by the administrator.</p>
            <p><strong>Date:</strong> ${new Date(booking.startTime).toLocaleString()}</p>
            <p>Please contact the department for more details or try a different time.</p>
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
