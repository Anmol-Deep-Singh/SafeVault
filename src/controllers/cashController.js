const User = require('../models/user');
const Transaction = require('../models/transaction').Transaction;

// Deposit cash (INR only)
const depositCash = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = req.user;

        // Validate amount
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            return res.status(400).json({
                error: 'Invalid amount. Amount must be greater than 0'
            });
        }

        // Update user's INR balance
        user.INR += depositAmount;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
            transactionId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            sender: {
                userId: user._id,
                fullName: "Cash Deposit",
                email: "system@safevault.com",
                mobileNumber: "0000000000"
            },
            receiver: {
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber
            },
            amount: depositAmount,
            currencyType: 'INR',
            status: 'completed'
        });

        await transaction.save();

        res.status(200).json({
            message: 'Cash deposit successful',
            transaction: transaction.getTransactionDetails(),
            newBalance: user.INR
        });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({
            error: 'Deposit failed',
            details: error.message
        });
    }
};

// Withdraw cash (INR only)
const withdrawCash = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = req.user;

        // Validate amount
        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            return res.status(400).json({
                error: 'Invalid amount. Amount must be greater than 0'
            });
        }

        // Check if user has sufficient balance
        if (user.INR < withdrawAmount) {
            return res.status(400).json({
                error: 'Insufficient balance',
                currentBalance: user.INR
            });
        }

        // Update user's INR balance
        user.INR -= withdrawAmount;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
            transactionId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            sender: {
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber
            },
            receiver: {
                userId: user._id,
                fullName: "Cash Withdrawal",
                email: "system@safevault.com",
                mobileNumber: "0000000000"
            },
            amount: withdrawAmount,
            currencyType: 'INR',
            status: 'completed'
        });

        await transaction.save();

        res.status(200).json({
            message: 'Cash withdrawal successful',
            transaction: transaction.getTransactionDetails(),
            newBalance: user.INR
        });
    } catch (error) {
        console.error('Withdrawal error:', error);
        res.status(500).json({
            error: 'Withdrawal failed',
            details: error.message
        });
    }
};

// Get cash transaction history
const getCashTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.query;

        let query = {
            currencyType: 'INR',
            $or: [
                { 'sender.userId': userId },
                { 'receiver.userId': userId }
            ]
        };

        if (type === 'deposits') {
            query = {
                currencyType: 'INR',
                'receiver.userId': userId,
                'sender.email': 'system@safevault.com'
            };
        } else if (type === 'withdrawals') {
            query = {
                currencyType: 'INR',
                'sender.userId': userId,
                'receiver.email': 'system@safevault.com'
            };
        }

        const transactions = await Transaction.find(query)
            .sort({ timestamp: -1 })
            .exec();

        res.status(200).json({
            transactions: transactions.map(t => t.getTransactionDetails()),
            totalTransactions: transactions.length
        });
    } catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({
            error: 'Failed to fetch cash transactions',
            details: error.message
        });
    }
};

module.exports = {
    depositCash,
    withdrawCash,
    getCashTransactions
}; 