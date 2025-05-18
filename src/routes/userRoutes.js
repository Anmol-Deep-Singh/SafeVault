const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Transaction = require('../models/transaction').Transaction;
const auth = require('../middleware/auth');
const {
    validateTransaction,
    validateBalance,
    validateConversion
} = require('../middleware/validations');
const {
    transferFunds,
    getTransactionHistory
} = require('../controllers/transactionController');
const {
    getCurrentRates,
    convertCurrencies
} = require('../controllers/conversionController');


const checkBannedStatus = async (req, res, next) => {
    try {
        const user = req.user;
        if (user.isBanned) {
            return res.status(403).json({
                error: 'Account banned',
                reason: user.banReason,
                bannedAt: user.bannedAt
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error checking user status' });
    }
};


router.use(auth);
router.use(checkBannedStatus);


router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        
        const conversionTransactions = await Transaction.find({
            'sender.userId': user._id,
            currencyType: { 
                $in: [
                    'INR_TO_Bitcoin', 'INR_TO_Ethereum', 'INR_TO_Dogecoin',
                    'Bitcoin_TO_INR', 'Bitcoin_TO_Ethereum', 'Bitcoin_TO_Dogecoin',
                    'Ethereum_TO_INR', 'Ethereum_TO_Bitcoin', 'Ethereum_TO_Dogecoin',
                    'Dogecoin_TO_INR', 'Dogecoin_TO_Bitcoin', 'Dogecoin_TO_Ethereum'
                ]
            }
        })
        .sort({ timestamp: -1 })
        .limit(10); 

        res.json({
            userDetails: {
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber,
                balances: {
                    INR: user.INR,
                    Bitcoin: user.Bitcoin,
                    Ethereum: user.Ethereum,
                    Dogecoin: user.Dogecoin
                }
            },
            conversionHistory: conversionTransactions.map(t => t.getTransactionDetails())
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Transaction Routes
router.post('/transfer/:username',
    validateTransaction,
    async (req, res, next) => {
        try {
            const receiver = await User.findOne({ fullName: req.params.username });
            if (!receiver) {
                return res.status(404).json({ error: 'Receiver not found' });
            }
            if (receiver.isBanned) {
                return res.status(403).json({ error: 'Cannot transfer to banned user' });
            }
            req.receiver = receiver;
            next();
        } catch (error) {
            res.status(500).json({ error: 'Error validating receiver' });
        }
    },
    validateBalance,
    transferFunds
);

router.get('/history/:userId', async (req, res, next) => {
    if (req.user._id.toString() !== req.params.userId) {
        return res.status(403).json({ error: 'Can only view your own transaction history' });
    }
    next();
}, getTransactionHistory);


router.get('/conversion/rates', getCurrentRates);

router.post('/conversion/convert/:userId',
    validateConversion,
    async (req, res, next) => {
        
        if (req.user._id.toString() !== req.params.userId) {
            return res.status(403).json({ error: 'Can only convert your own funds' });
        }
        next();
    },
    convertCurrencies
);

module.exports = router;
