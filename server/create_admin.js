const JsonDB = require('./utils/jsonDb');
const bcrypt = require('bcryptjs');

const User = new JsonDB('users');

const createAdmin = async () => {
    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@college.edu';

    const existingUser = User.findOne({ username });
    if (existingUser) {
        console.log('Admin user already exists.');
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    User.create({
        username,
        password: hashedPassword,
        email,
        role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
};

createAdmin();
