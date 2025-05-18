const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    INR: {
        type: Number,
        default: 0,
        min: 0
    },
    Bitcoin: {
        type: Number,
        default: 0,
        min: 0
    },
    Ethereum: {
        type: Number,
        default: 0,
        min: 0
    },
    Dogecoin: {
        type: Number,
        default: 0,
        min: 0
    },
    // Ban related fields
    isBanned: {
        type: Boolean,
        default: false
    },
    banReason: {
        type: String
    },
    bannedAt: {
        type: Date
    },
    banDuration: {
        type: Number,
        default: 48, // Default ban duration in hours
    },
    bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    // Flag related fields
    isFlaged: {
        type: Boolean,
        default: false
    },
    flagReason: {
        type: String
    },
    flaggedAt: {
        type: Date
    },
    flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, { 
    timestamps: true 
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Add method to check and lift ban
userSchema.methods.checkAndLiftBan = async function() {
    if (this.isBanned && this.bannedAt) {
        const banEndTime = new Date(this.bannedAt.getTime() + (this.banDuration * 60 * 60 * 1000));
        if (new Date() >= banEndTime) {
            this.isBanned = false;
            this.banReason = null;
            this.bannedAt = null;
            this.banDuration = 48; // Reset to default
            await this.save();
            return true; // Ban was lifted
        }
    }
    return false; // Ban is still active or user is not banned
};

// Add method to get remaining ban time
userSchema.methods.getRemainingBanTime = function() {
    if (!this.isBanned || !this.bannedAt) return null;
    
    const banEndTime = new Date(this.bannedAt.getTime() + (this.banDuration * 60 * 60 * 1000));
    const remainingTime = banEndTime - new Date();
    
    if (remainingTime <= 0) return null;
    
    const hours = Math.floor(remainingTime / (60 * 60 * 1000));
    const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    
    return {
        hours,
        minutes,
        total: remainingTime
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;