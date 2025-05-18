const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
    adminLogin,
    getAllUsers,
    banUser,
    flagUser,
    getAllTransactions,
    getFlaggedAndBannedUsers,
    getEmails,
    getEmailById,
    deleteEmail,
    markEmailAsRead,
    permanentlyDeleteUser
} = require('../controllers/adminController');

// Admin login
router.post('/login', adminLogin);

// Protected admin routes
router.use(adminAuth);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/flagged-banned', getFlaggedAndBannedUsers);
router.post('/users/:userId/ban', banUser);
router.post('/users/:userId/flag', flagUser);
router.delete('/users/:username/delete', permanentlyDeleteUser);

// Transaction management routes
router.get('/transactions', getAllTransactions);

// Email notification routes
router.get('/emails', getEmails);
router.get('/emails/:emailId', getEmailById);
router.delete('/emails/:emailId', deleteEmail);
router.patch('/emails/:emailId/read', markEmailAsRead);

module.exports = router; 