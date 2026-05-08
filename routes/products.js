const jwt = require('jsonwebtoken');
const tokenMiddleware = require('../middleware/token.middleware')
const multer = require('multer');

var exprss = require('express');
var router = exprss.Router();
var ProductSchema = require('../models/products.models')

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

router.put('/:id', [tokenMiddleware], async function (req, res, next) {
    try {
        let { id } = req.params;

        let product = await ProductSchema.findByIdAndUpdate(id, ({
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            image: req.body.image,
        }), { new: true });

        if (!product) return res.status(404).send({ error: 'Product not found' });

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