const mongoose = require('mongoose');
const { transactionalSchema } = require('./transaction.js');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    INR: {
        type: Number,
        default: 0
    },
    Bitcoin: {
        type: Number,
        default: 0
    },
    Ethereum: {
        type: Number,
        default: 0
    },
    Doggecoin: {
        type: Number,
        default: 0
    },
    transactions : [transactionalSchema]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;