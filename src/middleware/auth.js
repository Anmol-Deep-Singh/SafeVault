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

        if (user.isBanned) {
            const wasLifted = await user.checkAndLiftBan();
            if (!wasLifted) {
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
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

module.exports = auth; 