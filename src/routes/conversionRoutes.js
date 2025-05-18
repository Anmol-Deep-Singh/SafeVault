const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { getCurrentRates, convertCurrencies, getConversionHistory } = require('../controllers/conversionController');

// Validation middleware for currency conversion
const validateConversion = [
    body('amount').isFloat({ min: 0.000001 }).withMessage('Amount must be greater than 0.000001'),
    body('fromCurrency').isIn(['INR', 'Bitcoin', 'Ethereum', 'Dogecoin']).withMessage('Invalid source currency'),
    body('toCurrency').isIn(['INR', 'Bitcoin', 'Ethereum', 'Dogecoin']).withMessage('Invalid target currency')
];

// Get current conversion rates
router.get('/rates', auth, getCurrentRates);

// Convert currency
router.post('/convert', auth, validateConversion, convertCurrencies);

// Get conversion history
router.get('/history', auth, getConversionHistory);

module.exports = router; 