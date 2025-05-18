const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['FRAUD_ALERT', 'ERROR', 'SYSTEM'],
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    severity: {
        type: String,
        enum: ['HIGH', 'MEDIUM', 'LOW'],
        default: 'LOW'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for better query performance
emailSchema.index({ type: 1, createdAt: -1 });
emailSchema.index({ isRead: 1 });

const Email = mongoose.model('Email', emailSchema);

module.exports = Email; 