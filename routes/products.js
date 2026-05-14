const exprss = require('express')
const router = exprss.Router()
const mongoose = require('mongoose')
const multer = require('multer')

const ProductSchema = require('../models/products.models')
const OrderSchema = require('../models/orders.models')

const tokenMiddleware = require('../middleware/token.middleware')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images')
    },
    filename: function (req, file, cb) {
        cb(null, new Date().getTime() + '-' + file.originalname)
    },
})
const upload = multer({ storage: storage })

router.get('/', [tokenMiddleware], async function (req, res) {
    try {
        const products = await ProductSchema.find({})

        res.status(200).json({
            status: '200',
            message: 'Get products successful',
            data: products,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: '500',
            message: error.message,
            data: null,
        })
    }
})

router.get('/:id', [tokenMiddleware], async function (req, res) {
    try {
        const { id } = req.params

        const product = await ProductSchema.findById(id)

        if (!product)
            return res.status(404).json({
                status: '404',
                message: 'Product not found',
                data: null,
            })

        res.status(200).json({
            status: '200',
            message: 'Get product successful',
            data: { product },
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            status: '500',
            message: error.message,
            data: null,
        })
    }
})

//แสดง Order ทั้งหมดของ Product
router.get('/:id/orders', [tokenMiddleware], async function (req, res) {
    try {
        const productId = req.params.id

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: '400',
                message: 'Invalid Product ID',
                data: null,
            })
        }

        const product = await ProductSchema.findById(productId)
        if (!product)
            return res.status(400).json({
                status: '400',
                message: 'Product not found',
                data: null,
            })

        //ค้นหาออเดอร์ที่มีสินค้านี้อยู่
        const orders = await OrderSchema.find({ 'products.product': productId })
            .populate('user', 'username status')
            .populate('products.product', 'name price')

        let totalQuantitySold = 0
        let totalRevenue = 0

        const result = orders.map((order) => {
            // หาข้อมูลสินค้าตัวนี้ที่อยู่ในออเดอร์
            const myItem = order.products.find(
                (p) => p.product._id.toString() === productId
            )
            const quantity = myItem ? myItem.quantity : 0

            // บวกเยอะรวมและรายได้รวม
            totalQuantitySold += quantity
            totalRevenue += quantity * product.price

            // จัดรูปแบบข้อมูลที่ต้องการส่งกลับ
            return {
                orderId: order._id,
                customer: order.user?.username || 'Unknown User',
                quantity: quantity,
                totalPrice: order.total_price, // ราคาบิลรวม
                orderDate: order.createdAt,
            }
        })

        res.status(200).json({
            status: '200',
            message: 'Get product orders successful',
            data: {
                summary: {
                    totalOrders: orders.length,
                    totalQuantitySold: totalQuantitySold,
                    totalRevenue: totalRevenue,
                },
                product: product,
                orders: result,
            },
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: '500',
            message: error.message,
            data: null,
        })
    }
})

router.post(
    '/',
    upload.single('image'),
    [tokenMiddleware],
    async function (req, res) {
        try {
            const { productName, price, description, image, stock } = req.body
            const imagePath = req.file ? req.file.path : null

            const product = new ProductSchema({
                productName: productName,
                price: price,
                description: description,
                image: imagePath,
                stock: stock,
            })

            await product.save()

            res.status(201).json({
                status: '201',
                message: 'Create product successful',
                data: product,
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                status: '500',
                message: error.message,
                data: null,
            })
        }
    }
)

// เพิ่ม Order ใน Product
router.post('/:id/orders', [tokenMiddleware], async function (req, res) {
    try {
        const { userId, username } = req.user
        const { id: productId } = req.params
        const { quantity } = req.body

        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                status: '400',
                message: 'Quantity must be greater than 0',
                data: null,
            })
        }

        const product = await ProductSchema.findById(productId)
        if (!product) {
            return res.status(404).json({
                status: '404',
                message: 'Product not found',
                data: null,
            })
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                status: '400',
                message: 'Not enough stock',
                data: null,
            })
        }

        const totalPrice = product.price * quantity
        product.stock -= quantity

        const newOrder = new OrderSchema({
            user: userId,
            products: [
                {
                    product: productId,
                    quantity: quantity,
                    price: product.price,
                },
            ],
            total_price: totalPrice,
        })

        // บันทึกการเปลี่ยนแปลงของสินค้าและสร้างออเดอร์ใหม่
        await product.save()
        await newOrder.save()

        const responseData = {
            orderId: newOrder._id,
            customer: username,
            productName: product.productName,
            quantity: quantity,
            totalPrice: totalPrice,
            orderStatus: newOrder.status,
            orderDate: newOrder.createdAt,
        }

        return res.status(201).json({
            status: '201',
            message: 'Create order successful',
            data: responseData,
        })
    } catch (error) {
        console.error('Create Order Error:', error)
        return res.status(500).json({
            status: '500',
            message: error.message || 'Internal Server Error',
            data: null,
        })
    }
})

router.put('/:id', [tokenMiddleware], async function (req, res) {
    try {
        const { id } = req.params
        const { productName, price, description, image, stock } = req.body

        const product = await ProductSchema.findByIdAndUpdate(id, req.body, {
            new: true,
        })

        if (!product)
            return res.status(404).json({
                status: '404',
                message: 'Product not found',
                data: null,
            })

        res.status(201).json({
            status: '201',
            message: 'Update product successful',
            data: product,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: '500',
            message: error.message,
            data: null,
        })
    }
})

router.delete('/:id', [tokenMiddleware], async function (req, res) {
    try {
        const { id } = req.params

        const product = await ProductSchema.findByIdAndDelete(id)

        if (!product)
            return res.status(404).json({
                status: '404',
                message: 'Product not found',
                data: null,
            })

        res.status(200).json({
            status: '200',
            message: 'Delete product successful',
            data: null,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: '500',
            message: error.message,
            data: null,
        })
    }
})

module.exports = router
