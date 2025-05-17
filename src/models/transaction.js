const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String, required: true }
}, { _id: false });

const transactionalSchema = new mongoose.Schema({
    sender: { type: userInfoSchema, required: true },
    receiver: { type: userInfoSchema, required: true },
    amount: { type: Number, required: true },
    currencyType: { type: String, enum: ['Bitcoin', 'Ethereum', 'Dogecoin'], required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const Transaction = mongoose.model('Transaction', transactionalSchema);

module.exports = {
    Transaction,
    transactionalSchema
};