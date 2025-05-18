const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Transaction = require('../models/transaction').Transaction;
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { calculatePortfolioValueINR } = require('../utils/conversionRates');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Register new user
const register = async (req, res) => {
    try {
        const { fullName, email, mobileNumber, password } = req.body;

        // Validate required fields
        if (!fullName || !email || !mobileNumber || !password) {
            return res.status(400).json({ 
                error: 'All fields are required: fullName, email, mobileNumber, password' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { mobileNumber }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: 'User with this email or mobile number already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            fullName,
            email,
            mobileNumber,
            password: hashedPassword
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({ 
                error: 'Duplicate field value entered',
                field: Object.keys(error.keyPattern)[0]
            });
        }
        res.status(500).json({ 
            error: 'Error registering user',
            details: error.message 
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
};

// Get current user profile with balances and transaction history
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        const { type } = req.query;
        
        // Get all transactions (sent and received)
        const transactions = await Transaction.find({
            $or: [
                { 'sender.userId': user._id },
                { 'receiver.userId': user._id }
            ]
        })
        .sort({ timestamp: -1 })
        .limit(10);

        // Get conversion transactions
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
        .limit(5);

        // Get cash transactions with filtering
        let cashQuery = {
            currencyType: 'INR',
            $or: [
                { 
                    'receiver.userId': user._id,
                    'sender.email': 'system@safevault.com'
                },
                {
                    'sender.userId': user._id,
                    'receiver.email': 'system@safevault.com'
                }
            ]
        };

        if (type === 'deposits') {
            cashQuery = {
                currencyType: 'INR',
                'receiver.userId': user._id,
                'sender.email': 'system@safevault.com'
            };
        } else if (type === 'withdrawals') {
            cashQuery = {
                currencyType: 'INR',
                'sender.userId': user._id,
                'receiver.email': 'system@safevault.com'
            };
        }

        const cashTransactions = await Transaction.find(cashQuery)
            .sort({ timestamp: -1 })
            .exec();

        // Transform cash transactions into log format
        const cashTransactionLogs = cashTransactions.map(transaction => {
            const isDeposit = transaction.sender.email === 'system@safevault.com';
            return {
                transactionId: transaction.transactionId,
                timestamp: transaction.timestamp,
                type: isDeposit ? 'DEPOSIT' : 'WITHDRAWAL',
                amount: transaction.amount,
                status: transaction.status,
                balanceAfter: isDeposit ? 
                    `+${transaction.amount} INR` : 
                    `-${transaction.amount} INR`,
                description: isDeposit ?
                    `Cash Deposit of ${transaction.amount} INR` :
                    `Cash Withdrawal of ${transaction.amount} INR`
            };
        });

        // Calculate running balance for each transaction
        let runningBalance = user.INR;
        const cashLogs = cashTransactionLogs.map(log => {
            const amount = log.type === 'WITHDRAWAL' ? -log.amount : log.amount;
            runningBalance -= amount; // Subtract because we're going backwards in time
            return {
                ...log,
                runningBalance: runningBalance + amount // Add back for the balance at that point
            };
        }).reverse(); // Reverse to show oldest first

        // Calculate total portfolio value
        const balances = {
            INR: user.INR || 0,
            Bitcoin: user.Bitcoin || 0,
            Ethereum: user.Ethereum || 0,
            Dogecoin: user.Dogecoin || 0
        };
        const portfolioValue = calculatePortfolioValueINR(balances);

        res.json({
            profile: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber,
                createdAt: user.createdAt
            },
            portfolio: {
                totalValueINR: portfolioValue.totalValueINR,
                breakdown: portfolioValue.breakdown,
                percentages: portfolioValue.percentages,
                currentBalances: balances
            },
            recentActivity: {
                transactions: transactions.map(t => t.getTransactionDetails()),
                conversions: conversionTransactions.map(t => t.getTransactionDetails()),
                cashLogs: {
                    currentBalance: user.INR,
                    transactionType: type || 'all',
                    totalTransactions: cashLogs.length,
                    logs: cashLogs.map(log => ({
                        timestamp: log.timestamp,
                        transactionId: log.transactionId,
                        type: log.type,
                        amount: log.amount,
                        balanceAfter: log.runningBalance,
                        description: log.description,
                        status: log.status
                    }))
                }
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ 
            error: 'Error fetching profile',
            details: error.message
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['fullName', 'email', 'mobileNumber', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates' });
    }

    try {
        const user = req.user;

        for (let update of updates) {
            if (update === 'password') {
                user[update] = await bcrypt.hash(req.body[update], 10);
            } else {
                user[update] = req.body[update];
            }
        }

        await user.save();
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating profile' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
}; 