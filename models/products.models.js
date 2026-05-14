const mongoose = require('mongoose')
const { Schema } = mongoose

const ProductSchema = new Schema(
    {
        productName: { type: String },
        price: { type: Number },
        description: { type: String },
        image: { type: String },
        stock: { type: Number },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('product', ProductSchema, 'products')
