const express = require('express');
const router = express.Router();

const tokenMiddleware = require('../middleware/token.middleware')
const OrderSchema = require('../models/orders.models');


//แสดง Order ทุกรายการ
router.get('/', [tokenMiddleware], async function (req, res, next) {
    try {
        const { userId } = req.user;
        const orders = await OrderSchema.find({ user: userId })
            .populate('products.product', 'name price');

        let totalAmount = 0;
        let totalQuantity = 0;

        const formattedOrders = orders.map(order => {
            totalAmount += order.total_price;

            const mainItem = order.products[0];
            const quantity = mainItem ? mainItem.quantity : 0;

            totalQuantity += quantity;

            return {
                orderId: order._id,
                productName: mainItem?.product?.name || 'Unknown Product',
                unitPrice: mainItem ? mainItem.price : 0,
                quantity: quantity,
                totalPrice: order.total_price,
                paymentStatus: order.payment_status,
                orderStatus: order.status,
                orderDate: order.createdAt
            };
        });

        res.status(200).json({
            status: '200',
            message: 'Get orders successful',
            data: {
                summary: {
                    totalOrders: orders.length,
                    totalAmount: totalAmount,
                    totalQuantity: totalQuantity
                },
                orders: formattedOrders
            }
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: '500',
            message: error.message
        })
    }
})

module.exports = router;