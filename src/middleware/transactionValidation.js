const { body, param, validationResult } = require('express-validator');
const User = require('../models/user');

const validateTransaction = [
    body('amount')
        .isFloat({ min: 0.000001 })
        .withMessage('Amount must be greater than 0')
        .notEmpty()
        .withMessage('Amount is required'),
    body('currencyType')
        .isIn(['INR', 'Bitcoin', 'Ethereum', 'Dogecoin'])
        .withMessage('Invalid currency type'),
    body('receiverEmail')
        .isEmail()
        .withMessage('Valid receiver email is required'),
];

const validateBalance = async (req, res, next) => {
    try {
        const { amount, currencyType } = req.body;
        const sender = req.user; // From auth middleware

        if (sender[currencyType] < amount) {
            return res.status(400).json({
                error: `Insufficient ${currencyType} balance`
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Balance validation failed' });
    }
};

const validateReceiver = async (req, res, next) => {
    try {
        const { receiverEmail } = req.body;
        const receiver = await User.findOne({ email: receiverEmail });

        if (!receiver) {
            return res.status(404).json({
                error: 'Receiver not found'
            });
        }

        if (receiver.email === req.user.email) {
            return res.status(400).json({
                error: 'Cannot transfer to yourself'
            });
        }

        req.receiver = receiver;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Receiver validation failed' });
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
    validateTransaction,
    validateBalance,
    validateReceiver,
    handleValidationErrors
}; 