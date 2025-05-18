const { body, validationResult } = require('express-validator');

// Common validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Transaction validation
const validateTransaction = [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0.01'),
    body('currencyType')
        .isIn(['INR', 'Bitcoin', 'Ethereum', 'Dogecoin'])
        .withMessage('Invalid currency type'),
    handleValidationErrors
];

// Balance validation middleware
const validateBalance = async (req, res, next) => {
    try {
        const { amount, currencyType } = req.body;
        const user = req.user;

        if (!user[currencyType] || user[currencyType] < amount) {
            return res.status(400).json({
                error: 'Insufficient balance',
                details: `Not enough ${currencyType} balance`
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error validating balance' });
    }
};

// Conversion validation
const validateConversion = [
    body('amount')
        .isFloat({ min: 0.000001 })
        .withMessage('Amount must be greater than 0.000001'),
    body('fromCurrency')
        .isIn(['INR', 'Bitcoin', 'Ethereum', 'Dogecoin'])
        .withMessage('Invalid source currency'),
    body('toCurrency')
        .isIn(['INR', 'Bitcoin', 'Ethereum', 'Dogecoin'])
        .withMessage('Invalid target currency')
        .custom((value, { req }) => {
            if (value === req.body.fromCurrency) {
                throw new Error('Source and target currencies cannot be the same');
            }
            return true;
        }),
    handleValidationErrors
];

module.exports = {
    validateTransaction,
    validateBalance,
    validateConversion,
    handleValidationErrors
}; 