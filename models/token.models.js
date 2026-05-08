const moogoose = require('mongoose');
const { Schema } = moogoose;

const TokenSchema = new Schema({
    token: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true }
}, {
    timestamps: true
})

module.exports = moogoose.model('Token', TokenSchema);