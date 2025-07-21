const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const { model, Schema, Types } = mongoose;

const userSchema = new Schema({
    name: { 
        type: String, 
        required: true 
    },
    username: { 
        type: String, 
        required: true,
        unique: true 
    },
    password: { 
        type: String, 
        required: true,
        select: false 
    },
    email: { 
        type: String, 
        required: true,
        unique: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true,
        enum: ['admin', 'user'],
        default: 'user'
    },
    status: { 
        type: Boolean, 
        default: true 
    },
    createDate: {
        type: Date,
        default: () => new Date()
    },
    deleteDate: {
        type: Date
    }
}, {
    timestamps: true,
    versionKey: false 
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const user = model('user', userSchema, 'user');
module.exports = user;