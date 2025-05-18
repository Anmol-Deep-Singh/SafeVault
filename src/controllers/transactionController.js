const Transaction = require('../models/transaction').Transaction;
const User = require('../models/user');

// Transfer funds between users
const transferFunds = async (req, res) => {
    try {
        const { amount, currencyType, receiverEmail } = req.body;
        const sender = req.user;
        const receiver = req.receiver;

        // Convert amount to number and validate
        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            return res.status(400).json({
                error: 'Invalid amount'
            });
        }

        // Check sender's balance
        if (sender[currencyType] < transferAmount) {
            return res.status(400).json({
                error: `Insufficient ${currencyType} balance`
            });
        }

        // Update sender's balance
        sender[currencyType] -= transferAmount;
        await sender.save();

        // Update receiver's balance
        receiver[currencyType] = parseFloat(receiver[currencyType]) + transferAmount;
        await receiver.save();

        // Create transaction record
        const transaction = new Transaction({
            transactionId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            sender: {
                userId: sender._id,
                fullName: sender.fullName,
                email: sender.email,
                mobileNumber: sender.mobileNumber
            },
            receiver: {
                userId: receiver._id,
                fullName: receiver.fullName,
                email: receiver.email,
                mobileNumber: receiver.mobileNumber
            },
            amount: transferAmount,
            currencyType: currencyType,
            status: 'completed'
        });

        await transaction.save();

        res.status(200).json({
            message: 'Transfer successful',
            transaction: transaction.getTransactionDetails(),
            newBalance: sender[currencyType]
        });
    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({
            error: 'Transfer failed',
            details: error.message
        });
    }
};

// Get user's transaction history
const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.query;

        let query = {
            $or: [
                { 'sender.userId': userId },
                { 'receiver.userId': userId }
            ]
        };

        if (type === 'sent') {
            query = { 'sender.userId': userId };
        } else if (type === 'received') {
            query = { 'receiver.userId': userId };
        }

        const transactions = await Transaction.find(query)
            .sort({ timestamp: -1 })
            .exec();

        res.status(200).json({
            transactions: transactions.map(t => t.getTransactionDetails()),
            totalTransactions: transactions.length
        });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch transaction history',
            details: error.message
        });
    }
};

module.exports = {
    transferFunds,
    getTransactionHistory
};
