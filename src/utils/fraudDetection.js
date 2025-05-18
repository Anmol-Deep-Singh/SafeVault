const Transaction = require('../models/transaction').Transaction;
const User = require('../models/user');

// Fraud detection rules
const FRAUD_RULES = {
    LARGE_TRANSACTION: {
        INR: 1000000,        // 10 Lakh INR
        Bitcoin: 0.2,        // 0.2 BTC
        Ethereum: 3,         // 3 ETH
        Dogecoin: 50000      // 50K DOGE
    },
    MAX_DAILY_TRANSACTIONS: 50,
    SUSPICIOUS_TIME_WINDOW: 5 * 60 * 1000, // 5 minutes in milliseconds
    MAX_TRANSACTIONS_IN_WINDOW: 10
};

// Check for large transactions
async function checkLargeTransactions(startDate, endDate) {
    const largeTransactions = await Transaction.find({
        timestamp: { $gte: startDate, $lte: endDate },
        amount: {
            $gte: function() {
                return FRAUD_RULES.LARGE_TRANSACTION[this.currencyType] || 0;
            }
        },
        status: 'completed'
    }).sort({ timestamp: -1 });

    return largeTransactions.map(tx => ({
        type: 'LARGE_TRANSACTION',
        severity: 'HIGH',
        transaction: tx.getTransactionDetails(),
        description: `Large ${tx.currencyType} transaction detected: ${tx.amount}`
    }));
}

// Check for frequent transactions
async function checkFrequentTransactions(startDate, endDate) {
    const alerts = [];
    
    // Get all users
    const users = await User.find({});
    
    for (const user of users) {
        // Count user's transactions in the period
        const txCount = await Transaction.countDocuments({
            timestamp: { $gte: startDate, $lte: endDate },
            $or: [
                { 'sender.userId': user._id },
                { 'receiver.userId': user._id }
            ],
            status: 'completed'
        });

        if (txCount > FRAUD_RULES.MAX_DAILY_TRANSACTIONS) {
            alerts.push({
                type: 'FREQUENT_TRANSACTIONS',
                severity: 'MEDIUM',
                user: {
                    id: user._id,
                    email: user.email,
                    fullName: user.fullName
                },
                description: `User performed ${txCount} transactions in 24 hours`
            });
        }
    }

    return alerts;
}

// Check for rapid successive transactions
async function checkRapidTransactions(startDate, endDate) {
    const alerts = [];
    const users = await User.find({});

    for (const user of users) {
        // Get user's transactions ordered by timestamp
        const transactions = await Transaction.find({
            timestamp: { $gte: startDate, $lte: endDate },
            $or: [
                { 'sender.userId': user._id },
                { 'receiver.userId': user._id }
            ],
            status: 'completed'
        }).sort({ timestamp: 1 });

        // Check for transactions within suspicious time window
        let windowTransactions = [];
        for (const tx of transactions) {
            const windowStart = tx.timestamp.getTime() - FRAUD_RULES.SUSPICIOUS_TIME_WINDOW;
            windowTransactions = windowTransactions.filter(t => 
                t.timestamp.getTime() >= windowStart
            );
            windowTransactions.push(tx);

            if (windowTransactions.length > FRAUD_RULES.MAX_TRANSACTIONS_IN_WINDOW) {
                alerts.push({
                    type: 'RAPID_TRANSACTIONS',
                    severity: 'HIGH',
                    user: {
                        id: user._id,
                        email: user.email,
                        fullName: user.fullName
                    },
                    transactions: windowTransactions.map(t => t.getTransactionDetails()),
                    description: `User performed ${windowTransactions.length} transactions within 5 minutes`
                });
                break; // One alert per user is enough
            }
        }
    }

    return alerts;
}

// Main fraud detection function
async function detectFraud(startDate, endDate) {
    try {
        const [
            largeTransactions,
            frequentTransactions,
            rapidTransactions
        ] = await Promise.all([
            checkLargeTransactions(startDate, endDate),
            checkFrequentTransactions(startDate, endDate),
            checkRapidTransactions(startDate, endDate)
        ]);

        return {
            timestamp: new Date(),
            period: {
                start: startDate,
                end: endDate
            },
            alerts: [
                ...largeTransactions,
                ...frequentTransactions,
                ...rapidTransactions
            ],
            summary: {
                totalAlerts: largeTransactions.length + frequentTransactions.length + rapidTransactions.length,
                byType: {
                    largeTransactions: largeTransactions.length,
                    frequentTransactions: frequentTransactions.length,
                    rapidTransactions: rapidTransactions.length
                },
                bySeverity: {
                    HIGH: largeTransactions.length + rapidTransactions.length,
                    MEDIUM: frequentTransactions.length
                }
            }
        };
    } catch (error) {
        console.error('Fraud detection error:', error);
        throw error;
    }
}

module.exports = {
    detectFraud,
    FRAUD_RULES
}; 