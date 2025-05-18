const { body, validationResult } = require('express-validator');
const User = require('../models/user.js');

const validateRegistration = [
    body('fullName').notEmpty().withMessage('Full Name is required'),
    body('mobileNumber').isMobilePhone().withMessage('Invalid mobile number'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const validateLogin = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

const validateWithdrawal = async (req, res, next) => {
    const { username } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    try {
        const user = await User.findOne({ fullName: username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.INR < amount) {
            return res.status(400).json({ message: 'Insufficient balance for withdrawal' });
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    handleValidationErrors,
    validateWithdrawal,
};