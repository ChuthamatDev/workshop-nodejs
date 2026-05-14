const mongoose = require('mongoose')
const { Schema } = mongoose

const OrderSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'auth', required: true },
        products: [
            {
                product: {
                    type: Schema.Types.ObjectId,
                    ref: 'product',
                    required: true,
                },
                quantity: { type: Number, required: true, default: 1 },
                price: { type: Number, required: true },
            },
        ],
        total_price: { type: Number, required: true },
        payment_method: { type: String },
        payment_status: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        },
        status: {
            type: String,
            enum: [
                'pending',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
            ],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('order', OrderSchema, 'orders')
