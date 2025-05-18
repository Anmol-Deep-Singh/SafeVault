const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error();
        }

        // Check if user is banned and handle automatic ban lifting
        if (user.isBanned) {
            const wasLifted = await user.checkAndLiftBan();
            if (!wasLifted) {
                // Ban is still active
                const remainingTime = user.getRemainingBanTime();
                return res.status(403).json({
                    error: 'Account banned',
                    reason: user.banReason,
                    bannedAt: user.bannedAt,
                    remainingTime: remainingTime ? {
                        hours: remainingTime.hours,
                        minutes: remainingTime.minutes
                    } : null
                });
            }
            // Ban was lifted, continue with authenticated request
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

module.exports = auth; 