const User = require('../models/user');

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

module.exports = {
    getAllUsers
};
