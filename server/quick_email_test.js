const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Testing Gmail SMTP...\n');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.log('❌ SMTP Connection Failed!');
        console.log('Error:', error.message);
        console.log('\n⚠️  SOLUTION:');
        console.log('Your Gmail password in .env is an App Password, but Gmail may have blocked it.');
        console.log('\nSteps to fix:');
        console.log('1. Go to: https://myaccount.google.com/apppasswords');
        console.log('2. Sign in to your Google account');
        console.log('3. Create a NEW App Password for "Mail"');
        console.log('4. Copy the 16-character password (without spaces)');
        console.log('5. Update EMAIL_PASS in your .env file');
        console.log('6. Restart the server\n');
    } else {
        console.log('✅ SMTP Connection Successful!');
        console.log('Email configuration is working correctly.\n');

        // Try sending a test email
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_ADMIN_LEVEL_1,
            subject: 'Test - Venue System',
            text: 'Email is working!'
        }, (err, info) => {
            if (err) {
                console.log('❌ Failed to send test email:', err.message);
            } else {
                console.log('✅ Test email sent successfully!');
                console.log('Message ID:', info.messageId);
            }
            transporter.close();
        });
    }
});
