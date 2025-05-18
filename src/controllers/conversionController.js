const User = require('../models/user');
const Transaction = require('../models/transaction').Transaction;
const { convertCurrency, getConversionRates } = require('../utils/conversionRates');

// Get current conversion rates
const getCurrentRates = async (req, res) => {
    try {
        const rates = await getConversionRates();
        res.status(200).json({ rates });
    } catch (error) {
        console.error('Error fetching rates:', error);
        res.status(500).json({
            error: 'Failed to fetch conversion rates',
            details: error.message
        });
    }
};

// Convert currency
const convertCurrencies = async (req, res) => {
    try {
        const { amount, fromCurrency, toCurrency } = req.body;
        const user = req.user;

        // Validate amount
        const convertAmount = parseFloat(amount);
        if (isNaN(convertAmount) || convertAmount <= 0) {
            return res.status(400).json({
                error: 'Invalid amount. Amount must be greater than 0'
            });
        }

        // Check if user has sufficient balance
        if (user[fromCurrency] < convertAmount) {
            return res.status(400).json({
                error: 'Insufficient balance',
                currentBalance: user[fromCurrency],
                currency: fromCurrency
            });
        }

        // Convert currency
        const convertedAmount = await convertCurrency(convertAmount, fromCurrency, toCurrency);

        // Update user's balances
        user[fromCurrency] -= convertAmount;
        user[toCurrency] += convertedAmount;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
            sender: {
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber
            },
            receiver: {
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber
            },
            amount: convertAmount,
            currencyType: `${fromCurrency}_TO_${toCurrency}`,
            status: 'completed'
        });

        await transaction.save();

        res.status(200).json({
            message: 'Currency conversion successful',
            transaction: transaction.getTransactionDetails(),
            convertedAmount,
            newBalances: {
                [fromCurrency]: user[fromCurrency],
                [toCurrency]: user[toCurrency]
            }
        });
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({
            error: 'Currency conversion failed',
            details: error.message
        });
    }
};

// Get conversion history
const getConversionHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const query = {
            'sender.userId': userId,
            currencyType: { 
                $in: [
                    'INR_TO_Bitcoin', 'INR_TO_Ethereum', 'INR_TO_Dogecoin',
                    'Bitcoin_TO_INR', 'Bitcoin_TO_Ethereum', 'Bitcoin_TO_Dogecoin',
                    'Ethereum_TO_INR', 'Ethereum_TO_Bitcoin', 'Ethereum_TO_Dogecoin',
                    'Dogecoin_TO_INR', 'Dogecoin_TO_Bitcoin', 'Dogecoin_TO_Ethereum'
                ]
            }
        };

        const skip = (page - 1) * limit;

        const transactions = await Transaction.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .exec();

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            transactions: transactions.map(t => t.getTransactionDetails()),
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalTransactions: total
        });
    } catch (error) {
        console.error('Conversion history error:', error);
        res.status(500).json({
            error: 'Failed to fetch conversion history',
            details: error.message
        });
    }
};

module.exports = {
    getCurrentRates,
    convertCurrencies,
    getConversionHistory
}; 