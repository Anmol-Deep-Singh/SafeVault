const cron = require('node-cron');
const User = require('../models/user');
const { Transaction } = require('../models/transaction');

// Log mockup email report
function logCleanupReport(stats) {
    const emailContent = `
=============== MOCKUP EMAIL ===============
From: admin@safevault.com
To: admin@safevault.com
Subject: Monthly Data Cleanup Report
------------------------------------------

Monthly Cleanup Report
---------------------
The following records have been permanently deleted:

Users:
- Total Deleted: ${stats.users.count}

Transactions:
- Total Deleted: ${stats.transactions.count}

These records were soft-deleted more than 30 days ago.

------------------------------------------
=============== END EMAIL ===============
`;

    console.log(emailContent);
}

// Log mockup error email
function logErrorReport(error) {
    const errorEmailContent = `
=============== MOCKUP ERROR EMAIL ===============
From: admin@safevault.com
To: admin@safevault.com
Subject: [ERROR] Monthly Cleanup Job Failed
------------------------------------------

Monthly Cleanup Job Error
------------------------
The cleanup job failed with the following error:

${error.stack}

------------------------------------------
=============== END EMAIL ===============
`;

    console.error(errorEmailContent);
}

async function runCleanup() {
    try {
        console.log('Starting monthly cleanup...');
        
        // Calculate the date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find and delete users
        const usersToDelete = await User.findWithSoftDeleted()
            .where('isDeleted').equals(true)
            .where('deletedAt').lt(thirtyDaysAgo);
        
        const userIds = usersToDelete.map(user => user._id);
        const userStats = { count: userIds.length };

        // Find and delete transactions
        const transactionsToDelete = await Transaction.findWithSoftDeleted()
            .where('isDeleted').equals(true)
            .where('deletedAt').lt(thirtyDaysAgo);
        
        const transactionStats = { count: transactionsToDelete.length };

        // Perform the actual deletions
        if (userIds.length > 0) {
            await User.deleteMany({
                _id: { $in: userIds }
            });
        }

        if (transactionsToDelete.length > 0) {
            await Transaction.deleteMany({
                _id: { $in: transactionsToDelete.map(t => t._id) }
            });
        }

        const stats = {
            users: userStats,
            transactions: transactionStats
        };

        // Log mockup cleanup report
        logCleanupReport(stats);

        console.log('Cleanup completed successfully:', stats);
    } catch (error) {
        console.error('Cleanup job failed:', error);
        // Log mockup error report
        logErrorReport(error);
    }
}

// Schedule the job to run on the 1st of every month at 2 AM IST
const scheduleCleanup = () => {
    cron.schedule('0 2 1 * *', runCleanup, {
        timezone: 'Asia/Kolkata'
    });
    console.log('Cleanup job scheduled to run on the 1st of every month at 2 AM IST');
};

module.exports = {
    scheduleCleanup,
    runCleanup // Exported for manual running and testing
}; 