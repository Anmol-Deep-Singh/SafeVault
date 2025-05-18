const express = require('express');
const router = express.Router();
const { Transaction } = require('../models/transaction');
const User = require('../models/user');
const { generateUserReport } = require('../utils/pdfGenerator');
const auth = require('../middleware/auth');
const fs = require('fs');

// Route to download user report as PDF
router.get('/download/:userId', auth, async (req, res) => {
    try {
        // Check if the requesting user matches the userId or is an admin
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({
                error: 'Access denied. You can only download your own report.'
            });
        }

        // Get user details
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's last 5 transactions
        const transactions = await Transaction.find({
            $or: [
                { 'sender.userId': user._id },
                { 'receiver.userId': user._id }
            ],
            status: 'completed'
        })
        .sort({ timestamp: -1 })
        .limit(5);

        // Generate PDF report
        const { filename, filePath } = await generateUserReport(user, transactions);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // Stream the file to response
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ error: 'Error downloading report' });
            }
            
            // Delete the file after sending
            setTimeout(() => {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting temporary file:', unlinkErr);
                    }
                });
            }, 1000);
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({
            error: 'Error generating report',
            details: error.message
        });
    }
});

module.exports = router; 