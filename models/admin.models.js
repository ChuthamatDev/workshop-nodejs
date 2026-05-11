const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminSchema = new Schema({
    username: { type: String, required: true, unique: true, trim: true, },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' }
}, {
    timestamps: true
});

module.exports = mongoose.model('admin', AdminSchema, 'admin');