const Admin = require('../models/admin');
const User = require('../models/user');
const Transaction = require('../models/transaction').Transaction;
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const Email = require('../models/email');

// Generate JWT token for admin
const generateAdminToken = (adminId) => {
    return jwt.sign({ adminId, isAdmin: true }, JWT_SECRET, { expiresIn: '24h' });
};

// Admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin || !admin.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await admin.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        const token = generateAdminToken(admin._id);

        res.json({
            message: 'Admin login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            users: users.map(user => ({
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber,
                isBanned: user.isBanned || false,
                isFlaged: user.isFlaged || false,
                createdAt: user.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
};

// Ban/Unban a user
const banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, duration = 48, isBanned = true } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!isBanned) {
            // Unban user
            user.isBanned = false;
            user.banReason = null;
            user.bannedAt = null;
            user.banDuration = 48; // Reset to default
            await user.save();

            return res.json({
                message: 'User unbanned successfully',
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    isBanned: false
                }
            });
        }

        // Ban user
        user.isBanned = true;
        user.banReason = reason;
        user.bannedAt = new Date();
        user.banDuration = duration;
        user.bannedBy = req.admin._id;
        await user.save();

        const remainingTime = user.getRemainingBanTime();

        res.json({
            message: 'User banned successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isBanned: user.isBanned,
                banReason: user.banReason,
                bannedAt: user.bannedAt,
                banDuration: user.banDuration,
                remainingTime: remainingTime ? {
                    hours: remainingTime.hours,
                    minutes: remainingTime.minutes
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user ban status', details: error.message });
    }
};

// Flag/Unflag a user
const flagUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, isFlaged = true } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!isFlaged) {
            // Unflag user
            user.isFlaged = false;
            user.flagReason = null;
            user.flaggedAt = null;
            user.flaggedBy = null;
            await user.save();

            return res.json({
                message: 'User unflagged successfully',
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    isFlaged: false
                }
            });
        }

        // Flag user
        user.isFlaged = true;
        user.flagReason = reason;
        user.flaggedAt = new Date();
        user.flaggedBy = req.admin._id;
        await user.save();

        res.json({
            message: 'User flagged successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isFlaged: user.isFlaged,
                flagReason: user.flagReason,
                flaggedAt: user.flaggedAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user flag status', details: error.message });
    }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sort = 'desc', 
            userId,
            coins,
            startDate,
            endDate
        } = req.query;
        
        let query = {};

        // Filter by user(s)
        if (userId) {
            const userIds = userId.split(',').map(id => id.trim());
            query.$or = [
                { 'sender.userId': { $in: userIds } },
                { 'receiver.userId': { $in: userIds } }
            ];
        }

        // Filter by coin types
        if (coins) {
            const coinTypes = coins.split(',').map(coin => coin.trim());
            const currencyPatterns = [];
            
            coinTypes.forEach(coin => {
                // Direct currency matches
                currencyPatterns.push(coin);
                
                // Conversion patterns (e.g., "Bitcoin_TO_" or "_TO_Bitcoin")
                currencyPatterns.push(new RegExp(`${coin}_TO_`));
                currencyPatterns.push(new RegExp(`_TO_${coin}`));
            });

            query.currencyType = { $in: currencyPatterns };
        }

        // Filter by date range
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }

        const transactions = await Transaction.find(query)
            .sort({ timestamp: sort === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions: transactions.map(t => t.getTransactionDetails()),
            totalTransactions: total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            filters: {
                coins: coins ? coins.split(',') : [],
                userIds: userId ? userId.split(',') : [],
                dateRange: {
                    start: startDate || null,
                    end: endDate || null
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
    }
};

// Get all flagged and banned users
const getFlaggedAndBannedUsers = async (req, res) => {
    try {
        const { status } = req.query; // Optional: filter by 'flagged', 'banned', or both if not specified
        
        let query = {
            $or: [
                { isBanned: true },
                { isFlaged: true }
            ]
        };

        // Apply additional filter if status is specified
        if (status === 'flagged') {
            query = { isFlaged: true };
        } else if (status === 'banned') {
            query = { isBanned: true };
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ bannedAt: -1, flaggedAt: -1 });

        const formattedUsers = users.map(user => ({
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            mobileNumber: user.mobileNumber,
            status: {
                isBanned: user.isBanned || false,
                banReason: user.banReason,
                bannedAt: user.bannedAt,
                bannedBy: user.bannedBy,
                isFlaged: user.isFlaged || false,
                flagReason: user.flagReason,
                flaggedAt: user.flaggedAt,
                flaggedBy: user.flaggedBy
            },
            balances: {
                INR: user.INR,
                Bitcoin: user.Bitcoin,
                Ethereum: user.Ethereum,
                Dogecoin: user.Dogecoin
            },
            createdAt: user.createdAt
        }));

        res.json({
            total: formattedUsers.length,
            bannedCount: formattedUsers.filter(u => u.status.isBanned).length,
            flaggedCount: formattedUsers.filter(u => u.status.isFlaged).length,
            users: formattedUsers
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch flagged and banned users', 
            details: error.message 
        });
    }
};

// Get all admin emails with pagination and filters
const getEmails = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, isRead, severity } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (type) query.type = type;
        if (isRead !== undefined) query.isRead = isRead === 'true';
        if (severity) query.severity = severity;

        // Get emails with pagination
        const [emails, totalCount] = await Promise.all([
            Email.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Email.countDocuments(query)
        ]);

        // Get unread count
        const unreadCount = await Email.countDocuments({ isRead: false });

        res.json({
            emails,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalEmails: totalCount,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch emails', 
            details: error.message 
        });
    }
};

// Get single email by ID
const getEmailById = async (req, res) => {
    try {
        const email = await Email.findById(req.params.emailId);
        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }
        res.json(email);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch email', 
            details: error.message 
        });
    }
};

// Delete an email
const deleteEmail = async (req, res) => {
    try {
        const email = await Email.findByIdAndDelete(req.params.emailId);
        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }
        res.json({ message: 'Email deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to delete email', 
            details: error.message 
        });
    }
};

// Mark email as read
const markEmailAsRead = async (req, res) => {
    try {
        const email = await Email.findByIdAndUpdate(
            req.params.emailId,
            { isRead: true },
            { new: true }
        );
        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }
        res.json(email);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to update email', 
            details: error.message 
        });
    }
};

module.exports = {
    adminLogin,
    getAllUsers,
    banUser,
    flagUser,
    getAllTransactions,
    getFlaggedAndBannedUsers,
    getEmails,
    getEmailById,
    deleteEmail,
    markEmailAsRead
}; 