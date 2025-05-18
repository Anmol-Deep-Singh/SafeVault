const { validationResult } = require('express-validator');
const User = require('../models/user.js');

// Controller for /login
const loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        // For demo: plain text password check (replace with hashing in production)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        res.json({ message: 'Login successful', user: { fullName: user.fullName, email: user.email, mobileNumber: user.mobileNumber } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Controller for /register
const registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { fullName, mobileNumber, email, password } = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { mobileNumber }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email or mobile number already exists' });
        }
        // Create new user
        const newUser = new User({ fullName, mobileNumber, email, password });
        await newUser.save();
        res.status(201).json({ message: 'Registration successful', user: { fullName, email, mobileNumber } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { loginUser, registerUser };