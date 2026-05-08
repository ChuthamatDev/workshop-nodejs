const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization
        if (!token) return res.status(401).send({ error: 'Token is required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: '500',
            message: "Authentication failed"
        })
    }
}

