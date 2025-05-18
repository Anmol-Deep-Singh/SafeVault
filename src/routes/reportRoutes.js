const express = require('express');
const router = express.Router();
const { Transaction } = require('../models/transaction');
const User = require('../models/user');
const { generateUserReport, generateAPIDocumentation } = require('../utils/pdfGenerator');
const auth = require('../middleware/auth');
const fs = require('fs');

// Route to download user report as PDF
router.get('/download/:userId', auth, async (req, res) => {
    let filePath = null;
    
    try {
        console.log('Received request for user report:', req.params.userId);
        
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

        console.log('Found user:', user.email);

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

        console.log('Found transactions:', transactions.length);

        // Generate PDF report
        const result = await generateUserReport(user, transactions);
        
        if (!result.success) {
            console.error('Failed to generate report:', result.error);
            return res.status(500).json({
                error: 'Failed to generate report',
                details: result.error
            });
        }

        filePath = result.filePath;
        console.log('PDF generated successfully at:', filePath);

        // Check if file exists and has content
        if (!fs.existsSync(filePath)) {
            console.error('Generated file does not exist:', filePath);
            return res.status(500).json({
                error: 'Generated file not found'
            });
        }

        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            console.error('Generated file is empty:', filePath);
            return res.status(500).json({
                error: 'Generated file is empty'
            });
        }

        console.log('Sending file:', filePath, 'Size:', stats.size);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
        res.setHeader('Content-Length', stats.size);

        // Create a read stream and pipe it to the response
        const fileStream = fs.createReadStream(filePath);
        
        // Handle stream errors
        fileStream.on('error', (error) => {
            console.error('Error reading file stream:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error reading file' });
            }
        });

        // Pipe the file to the response
        fileStream.pipe(res);

        // Clean up the file after sending
        fileStream.on('end', () => {
            setTimeout(() => {
                if (filePath && fs.existsSync(filePath)) {
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting temporary file:', unlinkErr);
                        } else {
                            console.log('Temporary file deleted:', filePath);
                        }
                    });
                }
            }, 1000);
        });

    } catch (error) {
        console.error('Error in report download route:', error);
        
        // Clean up the file if it exists
        if (filePath && fs.existsSync(filePath)) {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting temporary file:', unlinkErr);
                }
            });
        }
        
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Error generating report',
                details: error.message
            });
        }
    }
});

router.get('/api-docs', async (req, res) => {
    try {
        console.log('Received request for API documentation');
        const result = await generateAPIDocumentation();
        console.log('Generation result:', result);

        if (!result.success || !result.filePath) {
            console.error('Failed to generate documentation:', result.error);
            return res.status(500).json({
                success: false,
                error: 'Failed to generate API documentation',
                details: result.error
            });
        }

        // Check if file exists and has content
        if (!fs.existsSync(result.filePath)) {
            console.error('Generated file does not exist:', result.filePath);
            return res.status(500).json({
                success: false,
                error: 'Generated file not found'
            });
        }

        const stats = fs.statSync(result.filePath);
        if (stats.size === 0) {
            console.error('Generated file is empty:', result.filePath);
            return res.status(500).json({
                success: false,
                error: 'Generated file is empty'
            });
        }

        console.log('Sending file:', result.filePath, 'Size:', stats.size);
        res.sendFile(result.filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Error sending file'
                });
            }
            
            // Clean up the file after sending
            fs.unlink(result.filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting temporary file:', unlinkErr);
            });
        });
    } catch (error) {
        console.error('Error in API documentation route:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

module.exports = router; 