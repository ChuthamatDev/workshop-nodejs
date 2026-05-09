const mongoose = require('mongoose')
const { Schema } = mongoose;

const AuthSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('auth', AuthSchema, 'auth');