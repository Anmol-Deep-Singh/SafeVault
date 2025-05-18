const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const Admin = require('../models/admin');

const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if it's an admin token
        if (!decoded.isAdmin) {
            throw new Error('Not authorized as admin');
        }

        const admin = await Admin.findById(decoded.adminId);

        if (!admin || !admin.isActive) {
            throw new Error('Admin not found or inactive');
        }

        req.token = token;
        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ 
            error: 'Please authenticate as admin.',
            details: error.message
        });
    }
};

module.exports = adminAuth; 