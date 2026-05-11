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
            message: 'Username or password are required',
            data: null
        });

        if (password.length < 8) return res.status(400).json({
            status: '400',
            message: 'Password must be at least 8 characters',
            data: null
        });

        const existingUser = await AuthSchema.findOne({ username: req.body.username });
        if (existingUser) return res.status(400).json({
            status: '400',
            message: 'Username already exists',
            data: null
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
            message: error.message,
            data: null
        })
    }
});

router.post('/login', async function (req, res, next) {
    try {

        const { username, password } = req.body;

        if (!username || !password) return res.status(400).json({
            status: '400',
            message: 'Username and password are required',
            data: null
        });

        const user = await AuthSchema.findOne({ username: req.body.username });
        if (!user) return res.status(400).json({
            status: '400',
            message: 'Invalid username or password',
            data: null
        });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json({
            status: '400',
            message: 'Invalid username or password',
            data: null
        });

        if (user.status !== 'approved') {
            return res.status(403).json({
                status: '403',
                message: `Account is ${user.status}`,
                data: null
            })
        };

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
        console.log(error);
        res.status(500).json({
            status: '500',
            message: 'Internal Server Error',
            data: null
        })

    }
})

router.post('/login-admin', async function (req, res, next) {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) return res.status(400).json({
            status: '400',
            message: 'Username and password are required',
            data: null
        });

        if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
            return res.status(400).json({
                status: '400',
                message: 'Invalid username or password',
                data: null
            });
        }

        const token = await jwt.sign({
            username: username,
            role: 'admin'
        }, process.env.JWT_SECRET_ADMIN, { expiresIn: '1h' });

        res.status(200).json({
            status: '200',
            message: 'Admin login successful',
            data: {
                username: username,
                role: role
            },
            token: token,
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: '500',
            message: 'Internal Server Error',
            data: null
        })
    }
})

module.exports = router;
