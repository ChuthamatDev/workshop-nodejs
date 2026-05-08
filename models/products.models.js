const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
    name: { type: String },
    price: { type: Number },
    description: { type: String },
    image: { type: String },
    stock: { type: Number, default: 0 },
}, {
    timestamps: true
})

module.exports = mongoose.model('product', ProductSchema, 'products');