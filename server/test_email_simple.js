const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('=== Gmail Configuration Test ===\n');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
console.log('\nAdmin Level Emails:');
console.log('Level 1:', process.env.EMAIL_LEVEL_1);
console.log('Level 2:', process.env.EMAIL_LEVEL_2);
console.log('Level 3:', process.env.EMAIL_LEVEL_3);
console.log('Level 4:', process.env.EMAIL_LEVEL_4);

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    pool: true,
    maxConnections: 5,
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    debug: true, // Enable debug output
    logger: true // Log to console
});

async function testEmail() {
    try {
        console.log('\n=== Testing SMTP Connection ===');

        // Verify connection
        await transporter.verify();
        console.log('✓ SMTP connection verified successfully!\n');

        // Send test email
        console.log('=== Sending Test Email ===');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_LEVEL_1, // Send to Level 1 admin
            subject: 'Test Email - Venue Allocation System',
            html: `
                <h2>Email Configuration Test</h2>
                <p>This is a test email from your Venue Allocation System.</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p>If you received this email, your email configuration is working correctly!</p>
                <hr>
                <p style="color: #666; font-size: 12px;">Sent from Venue Allocation System</p>
            `
        });

        console.log('✓ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        console.log('\n✓ Email configuration is working correctly!');

    } catch (error) {
        console.error('\n✗ Email test failed!');
        console.error('Error:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\n⚠ AUTHENTICATION ERROR:');
            console.error('Your Gmail credentials are incorrect or you need to:');
            console.error('1. Enable "Less secure app access" in Gmail settings');
            console.error('2. OR use an "App Password" instead of your regular password');
            console.error('   - Go to: https://myaccount.google.com/apppasswords');
            console.error('   - Generate an app password for "Mail"');
            console.error('   - Use that password in your .env file');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
            console.error('\n⚠ CONNECTION ERROR:');
            console.error('Cannot connect to Gmail SMTP server. Check your internet connection.');
        } else {
            console.error('\nFull error details:', error);
        }
    } finally {
        transporter.close();
    }
}

testEmail();
