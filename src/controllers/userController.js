const User = require('../models/user');
const Transaction = require('../models/transaction').Transaction;
const bcrypt = require('bcryptjs');

// Get list of all users
const getAllUsers = async (req, res) => {
    try {
        const { search = '' } = req.query;
        const searchRegex = new RegExp(search, 'i');

        const query = {
            $or: [
                { fullName: searchRegex },
                { email: searchRegex }
            ]
        };

        const users = await User.find(query)
            .select('fullName email mobileNumber')
            .sort({ fullName: 1 })
            .exec();

        res.status(200).json({
            users: users.map(user => ({
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber
            })),
            totalUsers: users.length
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Failed to fetch users',
            details: error.message
        });
    }
};

// Delete own account permanently
const deleteOwnAccount = async (req, res) => {
    try {
        const user = req.user;
        const { password } = req.body;

        // Verify password before deletion
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Delete all transactions where user is either sender or receiver
        await Transaction.deleteMany({
            $or: [
                { 'sender.userId': user._id },
                { 'receiver.userId': user._id }
            ]
        });

        // Delete user account
        await User.findByIdAndDelete(user._id);

        res.json({
            message: 'Your account and all related transactions have been permanently deleted'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to delete account', 
            details: error.message 
        });
    }
};

module.exports = {
    getAllUsers,
    deleteOwnAccount
};
