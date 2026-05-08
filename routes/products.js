const jwt = require('jsonwebtoken');
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

        let token = req.headers.authorization
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);

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

        if (!product) return res.status(404).send({ error: 'Product not found' });

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

router.get('/:id/orders', [tokenMiddleware], async function (req, res, next) {
    try {
        let { id } = req.params;

        let product = await ProductSchema.findById(id);

        if (!product) return res.status(404).send({ error: 'Product not found' });

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
            return {
                orderId: order._id,
                customer: order.user.username,
                quantity: order.products[0].quantity,
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
            }
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

        let { name, price, description, image } = req.body;
        let imagePath = req.file ? req.file.path : null;
        let product = new ProductSchema({
            name: name,
            price: price,
            description: description,
            image: imagePath,
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

router.post('/:id/orders', [tokenMiddleware], async function (req, res, next) {
    try {
        let { userId } = req.user;
        let { id } = req.params;
        let { quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).send({
                error: 'Quantity must be greater than 0'
            });
        }

        let product = await ProductSchema.findById(id);
        if (!product) return res.status(404).send({
            error: 'Product not found'
        });

        if (quantity > product.stock) {
            return res.status(400).send({ error: 'Not enough stock' });
        }

        let price = product.price;
        let total = price * quantity;

        product.stock -= quantity;
        await product.save();

        let newOrder = new OrderSchema({
            user: userId,
            products: [
                {
                    product: id,
                    quantity: quantity,
                    price: price,
                }
            ],
            total_price: total,
        });

        await newOrder.save();

        res.status(200).send({
            status: '200',
            message: 'Create order successful',
            data: newOrder,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: error.message
        })
    }
})

router.put('/:id', [tokenMiddleware], async function (req, res, next) {
    try {
        let { id } = req.params;
        let { name, price, description, image, stock } = req.body;

        let product = await ProductSchema.findByIdAndUpdate(id, ({
            name: name,
            price: price,
            description: description,
            image: image,
            stock: stock,
        }), { new: true });

        if (!product) return res.status(404).send({
            error: 'Product not found'
        });

        res.status(200).send({
            status: '200',
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

        if (!product) return res.status(404).send({ error: 'Product not found' });

        res.status(204).send({
            status: '204',
            message: 'Delete product successful',
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: error.message
        })
    }
})


module.exports = router;