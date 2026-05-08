const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

var express = require('express');
var router = express.Router();
var AuthSchema = require('../models/auth.models')

router.put('/:id/approve', async function (req, res, next) {
    try {
        let { id } = req.params;

        let user = await AuthSchema.findByIdAndUpdate(id, {
            status: 'approved'
        }, { new: true });

        if (!user) return res.status(404).send({ error: 'User not found' });

        res.status(200).send({
            status: '200',
            message: 'User approved successfully',
            data: {
                _id: user._id,
                username: user.username,
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
})

module.exports = router;
