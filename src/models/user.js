const mongoose = require('mongoose');

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
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true 
});

// Add compound index for soft delete queries
userSchema.index({ isDeleted: 1, deletedAt: 1 });

// Add query middleware to exclude soft deleted records by default
userSchema.pre('find', function() {
    if (!this.getQuery().includeSoftDeleted) {
        this.where({ isDeleted: false });
    }
});

userSchema.pre('findOne', function() {
    if (!this.getQuery().includeSoftDeleted) {
        this.where({ isDeleted: false });
    }
});

userSchema.pre('countDocuments', function() {
    if (!this.getQuery().includeSoftDeleted) {
        this.where({ isDeleted: false });
    }
});

// Add methods for soft delete operations
userSchema.methods.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
};

userSchema.methods.restore = async function() {
    this.isDeleted = false;
    this.deletedAt = null;
    await this.save();
};

// Static method to find including soft deleted
userSchema.statics.findWithSoftDeleted = function() {
    return this.find().where('includeSoftDeleted').equals(true);
};

const User = mongoose.model('User', userSchema);

module.exports = User;