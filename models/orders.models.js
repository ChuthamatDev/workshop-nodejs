const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
    products: [{ type: Schema.Types.ObjectId, ref: 'product' }],
    total_price: { type: Number },
    user: { type: Schema.Types.ObjectId, ref: 'auth' },
})

module.exports = mongoose.model('orders', OrderSchema, 'orders');