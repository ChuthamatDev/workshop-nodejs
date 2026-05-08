const mongoose = require('mongoose')
const { Schema } = mongoose;

const UserSchema = new Schema({
    username: { type: String, require: true, unique: true },
    password: { type: String },
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);