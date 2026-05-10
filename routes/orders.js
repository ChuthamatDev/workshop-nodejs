const express = require('express');
const router = express.Router();

const tokenMiddleware = require('../middleware/token.middleware')
var OrderSchema = require('../models/orders.models');
const ProductSchema = require('../models/products.models');

//แสดง Order ทุกรายการ
router.get('/', [tokenMiddleware], async function (req, res, next) {
    try {
        let { userId } = req.user;
        let orders = await OrderSchema.find({ user: userId }).populate({
            path: 'products.product',
            model: 'product',
            select: 'name price'
        });

        const summary = {
            totalOrders: orders.length,
            totalAmount: orders.reduce((sum, order) => sum + order.total_price, 0),
            totalQuantity: orders.reduce((sum, order) => {
                // รวมจำนวนชิ้นสินค้าจากทุกออเดอร์
                const itemsCount = order.products.reduce((pSum, p) => pSum + p.quantity, 0);
                return sum + itemsCount;
            }, 0)
        };

        const formattedOrders = orders.map(order => ({
            orderId: order._id,
            totalPrice: order.total_price,
            paymentStatus: order.payment_status,
            orderStatus: order.status,
            orderDate: order.createdAt,
            products: order.products.map(item => ({
                name: item.product ? item.product.name : 'Unknown Product',
                quantity: item.quantity,
                price: item.price
            }))
        }));

        res.status(200).send({
            status: '200',
            message: 'Get orders successful',
            data: formattedOrders,
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