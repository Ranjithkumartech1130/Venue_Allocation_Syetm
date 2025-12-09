const JsonDB = require('../utils/jsonDb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = new JsonDB('users');

exports.register = async (req, res) => {
    try {
        const { username, password, email, role } = req.body;
        const existingUser = User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newRole = role === 'admin' ? 'admin' : 'user';

        const user = User.create({ username, password: hashedPassword, email, role: newRole });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretKey', { expiresIn: '1d' });
        res.json({ token, role: user.role, username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Exclude password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
