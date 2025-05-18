const mongoose = require('mongoose');
const User = require('../models/user');
const Transaction = require('../models/transaction').Transaction;
const { generateUserReport } = require('../utils/pdfGenerator');

async function createSampleTransactions() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/safeVault', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');

        // Create main user
        const mainUser = new User({
            fullName: "Anmoldeep Singh",
            email: "anmol@example.com",
            password: "securepass123",
            mobileNumber: "9876543210",
            INR: 500000, // Initial deposit of 5 lakh INR
            Bitcoin: 0,
            Ethereum: 0,
            Dogecoin: 0
        });
        await mainUser.save();
        console.log('Main user created:', mainUser.fullName);

        // Create other users for transactions
        const otherUsers = [
            {
                fullName: "Rahul Kumar",
                email: "rahul@example.com",
                password: "pass123",
                mobileNumber: "9876543211",
                INR: 100000
            },
            {
                fullName: "Priya Sharma",
                email: "priya@example.com",
                password: "pass123",
                mobileNumber: "9876543212",
                INR: 100000
            },
            {
                fullName: "Amit Patel",
                email: "amit@example.com",
                password: "pass123",
                mobileNumber: "9876543213",
                INR: 100000
            },
            {
                fullName: "Neha Gupta",
                email: "neha@example.com",
                password: "pass123",
                mobileNumber: "9876543214",
                INR: 100000
            }
        ];

        const createdUsers = await Promise.all(
            otherUsers.map(userData => {
                const user = new User(userData);
                return user.save();
            })
        );
        console.log('Other users created successfully');

        // Create sample transactions
        const transactions = [
            {
                sender: mainUser,
                receiver: createdUsers[0],
                amount: 25000,
                currencyType: 'INR',
                description: 'Rent payment'
            },
            {
                sender: mainUser,
                receiver: createdUsers[1],
                amount: 15000,
                currencyType: 'INR',
                description: 'Shopping split'
            },
            {
                sender: createdUsers[2],
                receiver: mainUser,
                amount: 35000,
                currencyType: 'INR',
                description: 'Project payment'
            },
            {
                sender: mainUser,
                receiver: createdUsers[3],
                amount: 20000,
                currencyType: 'INR',
                description: 'Event expenses'
            },
            {
                sender: createdUsers[1],
                receiver: mainUser,
                amount: 45000,
                currencyType: 'INR',
                description: 'Loan repayment'
            }
        ];

        // Execute transactions
        for (const tx of transactions) {
            // Update sender's balance
            tx.sender.INR -= tx.amount;
            await tx.sender.save();

            // Update receiver's balance
            tx.receiver.INR += tx.amount;
            await tx.receiver.save();

            // Create transaction record
            const transaction = new Transaction({
                sender: {
                    userId: tx.sender._id,
                    fullName: tx.sender.fullName,
                    email: tx.sender.email,
                    mobileNumber: tx.sender.mobileNumber
                },
                receiver: {
                    userId: tx.receiver._id,
                    fullName: tx.receiver.fullName,
                    email: tx.receiver.email,
                    mobileNumber: tx.receiver.mobileNumber
                },
                amount: tx.amount,
                currencyType: tx.currencyType,
                status: 'completed',
                description: tx.description
            });
            await transaction.save();
            console.log(`Transaction completed: ${tx.sender.fullName} -> ${tx.receiver.fullName}, Amount: ${tx.amount} ${tx.currencyType}`);
        }

        // Get all transactions for the main user
        const userTransactions = await Transaction.find({
            $or: [
                { 'sender.userId': mainUser._id },
                { 'receiver.userId': mainUser._id }
            ]
        }).sort({ timestamp: -1 });

        // Generate PDF report
        console.log('Generating transaction report...');
        const report = await generateUserReport(mainUser, userTransactions);
        console.log('Report generated successfully at:', report.filePath);

        // Display final balance
        const updatedMainUser = await User.findById(mainUser._id);
        console.log('\nFinal balance for', mainUser.fullName);
        console.log('INR:', updatedMainUser.INR);

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed after error');
        }
        process.exit(1);
    }
}

// Run the script
createSampleTransactions(); 