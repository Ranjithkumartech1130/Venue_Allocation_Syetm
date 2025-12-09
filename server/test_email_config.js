require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('--- Testing Email Configuration ---');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not Set');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not Set');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('ERROR: EMAIL_USER or EMAIL_PASS is missing in .env file');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self for testing
        subject: 'Test Email from Venue App',
        text: 'If you receive this, your email configuration is working!'
    };

    try {
        console.log('Attempting to send email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('FAILED to send email.');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        if (error.response) {
            console.error('SMTP Response:', error.response);
        }
    }
};

testEmail();
