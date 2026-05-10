const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const tokenMiddleware = require('../middleware/token.middleware')
const multer = require('multer');

var exprss = require('express');
var router = exprss.Router();
var ProductSchema = require('../models/products.models')
var OrderSchema = require('../models/orders.models')
var AuthSchema = require('../models/auth.models')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images')
    },
    filename: function (req, file, cb) {
        cb(null, new Date().getTime() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })

router.get('/', [tokenMiddleware], async function (req, res, next) {
    try {
        let products = await ProductSchema.find({});

        res.status(200).send({
            status: '200',
            message: 'Get products successful',
            data: products,
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: error.message
        })
    }
})

router.get('/:id', [tokenMiddleware], async function (req, res, next) {
    try {
        let { id } = req.params;

        let product = await ProductSchema.findById(id);

        if (!product) return res.status(404).send({
            status: '404',
            message: 'Product not found',
            data: null
        });

        res.status(200).send({
            status: '200',
            message: 'Get product successful',
            data: { product },
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: error.message
        })
    }
})

//แสดง Order ทั้งหมดของ Product
router.get('/:id/orders', [tokenMiddleware], async function (req, res, next) {
    try {
        let { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({
                status: '400',
                message: 'Product not found',
                data: null
            });
        }

        let product = await ProductSchema.findById(id);

        if (!product) return res.status(404).send({
            status: '404',
            message: 'Product not found',
            data: null
        });

        let orders = await OrderSchema.find({ 'products.product': id })
            .populate({
                path: 'user',
                model: 'auth',
                select: 'username status'
            })
            .populate({
                path: 'products.product',
                model: 'product',
                select: 'name price'
            });

        const cleanOrders = orders.map(order => {

            const targetProduct = order.products.find((item) => item.product._id.toString() === id);

            return {
                orderId: order._id,
                customer: order.user ? order.user.username : 'Unknown User',
                quantity: targetProduct ? targetProduct.quantity : 0,
                totalPrice: order.total_price,
                paymentStatus: order.payment_status,
                orderDate: order.createdAt
            }
        });

        res.status(200).send({
            status: '200',
            message: 'Get product orders successful',
            data: {
                product: product,
                orders: cleanOrders
            },
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: error.message
        })
    }
})

router.post('/', upload.single('image'), [tokenMiddleware], async function (req, res, next) {
    try {

        let { name, price, description, image, stock } = req.body;
        let imagePath = req.file ? req.file.path : null;

        let product = new ProductSchema({
            name: name,
            price: price,
            description: description,
            image: imagePath,
            stock: stock,
        })

        await product.save();

        res.status(200).send({
            status: '200',
            message: 'Create product successful',
            data: product,
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: error.message
        })
    }
})

// เพิ่ม Order ใน Product
router.post('/:id/orders', [tokenMiddleware], async function (req, res, next) {
    try {
        const { userId, username } = req.user;
        const { id: productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).send({
                status: '400',
                message: 'Quantity must be greater than 0',
                data: null
            });
        }

        const product = await ProductSchema.findById(productId);
        if (!product) {
            return res.status(404).send({
                status: '404',
                message: 'Product not found',
                data: null
            });
        }

        if (quantity > product.stock) {
            return res.status(400).send({
                status: '400',
                message: 'Not enough stock',
                data: null
            });
        }

        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;

        product.stock -= quantity;

        const newOrder = new OrderSchema({
            user: userId,
            products: [{
                product: productId,
                quantity: quantity,
                price: unitPrice,
            }],
            total_price: totalPrice,
        });

        await product.save();
        await newOrder.save();

        const cleanOrderResponse = {
            orderId: newOrder._id,
            customer: username,
            product: product.name,
            quantity: quantity,
            totalPrice: totalPrice,
            paymentStatus: newOrder.payment_status,
            orderStatus: newOrder.status,
            orderDate: newOrder.createdAt
        };

        return res.status(201).send({
            status: '201',
            message: 'Create order successful',
            data: cleanOrderResponse
        });

    } catch (error) {
        console.error("Create Order Error:", error);
        return res.status(500).send({
            status: '500',
            message: error.message || 'Internal Server Error',
            data: null
        });
    }
});

router.put('/:id', [tokenMiddleware], async function (req, res, next) {
    try {
        let { id } = req.params;
        let { name, price, description, image, stock } = req.body;

        let product = await ProductSchema.findByIdAndUpdate(id, req.body, { new: true });

        if (!product) return res.status(404).send({
            status: '404',
            message: 'Product not found',
            data: null
        });

        res.status(201).send({
            status: '201',
            message: 'Update product successful',
            data: product,
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: error.message
        })
    }
})

router.delete('/:id', [tokenMiddleware], async function (req, res, next) {
    try {
        let { id } = req.params;

        let product = await ProductSchema.findByIdAndDelete(id);

        if (!product) return res.status(404).send({
            status: '404',
            message: 'Product not found',
            data: null
        });

        res.status(200).send({
            status: '200',
            message: 'Delete product successful',
            data: null
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: error.message
        })
    }
})


module.exports = router;