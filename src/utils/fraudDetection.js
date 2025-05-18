const Transaction = require('../models/transaction').Transaction;
const User = require('../models/user');
const { getCurrentRates } = require('../utils/conversionRates');

// Fraud detection rules
const FRAUD_RULES = {
    LARGE_TRANSACTION_PERCENTAGE: 0.9, // 90% of total assets
    MAX_DAILY_TRANSACTIONS: 50,
    SUSPICIOUS_TIME_WINDOW: 5 * 60 * 1000, // 5 minutes in milliseconds
    MAX_TRANSACTIONS_IN_WINDOW: 10
};

// Calculate total assets value in INR
async function calculateTotalAssetsInINR(user) {
    const rates = await getCurrentRates();
    
    const bitcoinValueINR = user.Bitcoin * rates.Bitcoin.INR;
    const ethereumValueINR = user.Ethereum * rates.Ethereum.INR;
    const dogecoinValueINR = user.Dogecoin * rates.Dogecoin.INR;
    
    return user.INR + bitcoinValueINR + ethereumValueINR + dogecoinValueINR;
}

// Convert transaction amount to INR
async function convertToINR(amount, currencyType) {
    if (currencyType === 'INR') return amount;
    
    const rates = await getCurrentRates();
    return amount * rates[currencyType].INR;
}

// Check for large transactions
async function checkLargeTransactions(startDate, endDate) {
    const alerts = [];
    const transactions = await Transaction.find({
        timestamp: { $gte: startDate, $lte: endDate },
        status: 'completed'
    }).sort({ timestamp: -1 });

    for (const tx of transactions) {
        const sender = await User.findById(tx.sender.userId);
        if (!sender) continue;

        // Calculate total assets in INR
        const totalAssetsINR = await calculateTotalAssetsInINR(sender);
        
        // Convert transaction amount to INR for comparison
        const transactionAmountINR = await convertToINR(tx.amount, tx.currencyType);
        
        // Check if transaction amount exceeds 90% of total assets
        if (transactionAmountINR > totalAssetsINR * FRAUD_RULES.LARGE_TRANSACTION_PERCENTAGE) {
            alerts.push({
                type: 'LARGE_TRANSACTION',
                severity: 'HIGH',
                transaction: tx.getTransactionDetails(),
                user: {
                    id: sender._id,
                    email: sender.email,
                    fullName: sender.fullName
                },
                description: `Large transaction detected: ${tx.amount} ${tx.currencyType} (${transactionAmountINR.toFixed(2)} INR), exceeding 90% of total assets (${totalAssetsINR.toFixed(2)} INR)`
            });
        }
    }

    return alerts;
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

        // Process alerts and ban/flag users
        const allAlerts = [...largeTransactions, ...frequentTransactions, ...rapidTransactions];
        
        // Ban and flag users for HIGH severity alerts
        for (const alert of allAlerts) {
            if (alert.user && (alert.severity === 'HIGH' || alert.type === 'RAPID_TRANSACTIONS')) {
                const user = await User.findById(alert.user.id);
                if (user && !user.isBanned) {
                    // Ban user
                    user.isBanned = true;
                    user.banReason = `Automatic ban due to ${alert.type}: ${alert.description}`;
                    user.bannedAt = new Date();
                    user.banDuration = 48; // 2 days ban
                    user.bannedBy = null; // System ban

                    // Flag user
                    user.isFlaged = true;
                    user.flagReason = `Automatic flag due to ${alert.type}: ${alert.description}`;
                    user.flaggedAt = new Date();
                    user.flaggedBy = null; // System flag

                    await user.save();
                }
            }
        }

        return {
            timestamp: new Date(),
            period: {
                start: startDate,
                end: endDate
            },
            alerts: allAlerts,
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