const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const express = require('express');
const router = express.Router();
const AuthSchema = require('../models/auth.models')

router.put('/:id/approve', async function (req, res, next) {
    try {
        const { id } = req.params;

        const user = await AuthSchema.findByIdAndUpdate(id,
            {
                status: 'approved',
            }, { new: true });

        if (!user) return res.status(404).json({
            status: '404',
            message: 'User not found',
            data: null
        });

        res.status(200).json({
            status: '200',
            message: 'User approved successfully',
            data: {
                _id: user._id,
                username: user.username,
                status: user.status,
                updatedAt: user.updatedAt
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
})

module.exports = router;
