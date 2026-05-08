const jwt = require('jsonwebtoken');
const tokenMiddleware = require('../middleware/token.middleware')

var exprss = require('express');
var router = exprss.Router();
var OrderSchema = require('../models/orders.models')

router.get('/', [tokenMiddleware], async function (req, res, next) {
    try {
        let orders = await OrderSchema.find({});

        let token = req.headers.authorization
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);

        res.status(200).send({
            status: '200',
            message: 'Get orders successful',
            data: orders,
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