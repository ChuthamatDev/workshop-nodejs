const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const AuthSchema = require('../models/auth.models')

router.post('/register', async function (req, res, next) {
    try {
        const { username, password } = req.body;

        if (username === '' || password === '') return res.status(400).json({
            status: '400',
            message: 'Username or password are required'
        });

        if (password.length < 8) return res.status(400).json({
            status: '400',
            message: 'Password must be at least 8 characters'
        });

        const existingUser = await AuthSchema.findOne({ username: req.body.username });
        if (existingUser) return res.status(400).json({
            status: '400',
            message: 'Username already exists'
        });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new AuthSchema({
            username: username,
            password: hashedPassword,
        })

        await user.save();

        res.status(201).json({
            status: '201',
            message: 'Register successful',
            data: {
                _id: user._id,
                username: username,
                status: user.status,
            }
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: '500',
            message: error.message
        })
    }
});

router.post('/login', async function (req, res, next) {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).json({
        status: '400',
        message: 'Username and password are required'
    });

    const user = await AuthSchema.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({
        status: '400',
        message: 'Invalid username or password'
    });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({
        status: '400',
        message: 'Invalid username or password'
    });

    if (user.status !== 'approved') {
        return res.status(403).json({
            status: '403',
            message: `Account is ${user.status}`,
        })
    };

    try {
        const token = await jwt.sign({
            userId: user._id,
            username: user.username
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            status: '200',
            message: 'Login successful',
            data: {
                _id: user._id,
                username: user.username,
            },
            token: token,
        })

    } catch (error) {
        res.status(500).json({
            status: '500',
            message: 'Internal Server Error'
        })
        console.log(error);
    }
})

module.exports = router;
