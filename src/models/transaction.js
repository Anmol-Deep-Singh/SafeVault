const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String, required: true }
}, { _id: false });

const transactionalSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
        default: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    },
    sender: { type: userInfoSchema, required: true },
    receiver: { type: userInfoSchema, required: true },
    amount: { type: Number, required: true },
    currencyType: { 
        type: String, 
        enum: [
            'INR', 'Bitcoin', 'Ethereum', 'Dogecoin',
            'INR_TO_Bitcoin', 'INR_TO_Ethereum', 'INR_TO_Dogecoin',
            'Bitcoin_TO_INR', 'Bitcoin_TO_Ethereum', 'Bitcoin_TO_Dogecoin',
            'Ethereum_TO_INR', 'Ethereum_TO_Bitcoin', 'Ethereum_TO_Dogecoin',
            'Dogecoin_TO_INR', 'Dogecoin_TO_Bitcoin', 'Dogecoin_TO_Ethereum'
        ], 
        required: true 
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    timestamp: { type: Date, default: Date.now }
}, { 
    timestamps: true 
});

// Add a method to get transaction details
transactionalSchema.methods.getTransactionDetails = function() {
    return {
        transactionId: this.transactionId,
        sender: {
            fullName: this.sender.fullName,
            email: this.sender.email
        },
        receiver: {
            fullName: this.receiver.fullName,
            email: this.receiver.email
        },
        amount: this.amount,
        currencyType: this.currencyType,
        status: this.status,
        timestamp: this.timestamp
    };
};

const Transaction = mongoose.model('Transaction', transactionalSchema);

module.exports = {
    Transaction,
    transactionalSchema
};