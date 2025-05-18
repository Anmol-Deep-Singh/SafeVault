const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    validateTransaction,
    validateBalance,
    validateReceiver,
    handleValidationErrors
} = require('../middleware/transactionValidation');
const {
    transferFunds,
    getTransactionHistory,
    getBalance
} = require('../controllers/transactionController');

// All routes require authentication
router.use(auth);

// Transfer funds
router.post('/transfer',
    validateTransaction,
    handleValidationErrors,
    validateReceiver,
    validateBalance,
    transferFunds
);

// Get transaction history
router.get('/history', getTransactionHistory);

// Get current balance
router.get('/balance', getBalance);

module.exports = router;
