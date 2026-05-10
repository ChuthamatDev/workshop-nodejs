const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

var express = require('express');
var router = express.Router();
var AuthSchema = require('../models/auth.models')

router.post('/register', async function (req, res, next) {
    try {
        let { username, password } = req.body;

        if (username === '' || password === '') return res.status(400).send({ error: 'Username or password are required' });

        let existingUser = await AuthSchema.findOne({ username: req.body.username });

        if (existingUser) return res.status(400).send({ error: 'Username already exists' });

        if (password.length < 8) return res.status(400).send({ error: 'Password must be at least 8 characters' });

        let user = new AuthSchema({
            username: username,
            password: await bcrypt.hash(password, 10),
        })

        await user.save();

        res.status(200).send({
            status: '200',
            message: 'Register successful',
            data: {
                _id: user._id,
                username: username,
                status: user.status,
            }
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: error.message
        })
    }
});

router.post('/login', async function (req, res, next) {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).send({
        status: '400',
        error: 'Username and Password are required'
    });

    let user = await AuthSchema.findOne({ username: req.body.username });

    if (!user) return res.status(400).send({ status: '400', error: `${username} does not exist,Please register first` });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send({ status: '400', error: 'Invalid username or password' });

    if (user.status === 'pending') return res.status(400).send({ status: '400', error: 'Your account is pending approval' });
    if (user.status === 'rejected') return res.status(400).send({ status: '400', error: 'Your account is rejected' });

    try {
        console.log(user.username)
        let token = await jwt.sign({
            userId: user._id,
            username: user.username
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).send({
            status: '200',
            message: 'Login successful',
            data: {
                _id: user._id,
                username: user.username,
            },
            token: token,
        })

    } catch (error) {
        res.status(500).send({
            status: '500',
            message: 'Internal Server Error'
        })
        console.log(error);
    }
})

module.exports = router;
