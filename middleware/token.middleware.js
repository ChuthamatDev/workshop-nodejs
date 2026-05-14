const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return res.status(401).send({
                status: '401',
                message: 'Authorization header missing or invalid',
            })
        }

        const token = authHeader.split('Bearer ')[1]
        if (!token)
            return res.status(401).send({
                status: '401',
                message: 'Token is required',
            })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        return next()
    } catch (error) {
        console.log(error)
        return res.status(401).send({
            status: '401',
            message: 'Authentication failed',
        })
    }
}
