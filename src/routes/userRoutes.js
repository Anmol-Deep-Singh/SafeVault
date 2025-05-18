const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const Transaction = require('../models/transaction.js');
const { validateWithdrawal } = require('../controllers/validationMiddleware.js');
const auth = require('../middleware/auth');
const { getAllUsers } = require('../controllers/userController');

router.get('/', auth, getAllUsers);

router.get('/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            fullName: user.fullName,
            email: user.email,
            mobileNumber: user.mobileNumber,
            balances: {
                INR: user.INR,
                Bitcoin: user.Bitcoin,
                Ethereum: user.Ethereum,
                Dogecoin: user.Dogecoin
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

router.post('/:userId/withdraw', validateWithdrawal, (req, res) => {
    res.send(`Withdraw endpoint for user: ${req.params.userId}`);
});

router.post('/:userId/deposit', auth, async (req, res) => {
    try {
        const { amount, currencyType } = req.body;
        
        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!['INR', 'Bitcoin', 'Ethereum', 'Dogecoin'].includes(currencyType)) {
            return res.status(400).json({ error: 'Invalid currency type' });
        }

        // Check if user exists and is the same as authenticated user
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Update user's balance
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user[currencyType] += amount;
        await user.save();

        res.json({
            message: 'Deposit successful',
            newBalance: user[currencyType]
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
