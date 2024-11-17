module.exports =  (req, res, next) => {
        const token = req.session.token;

        if (!token) {
            return res.status(401).send('Unauthorized: No token provided');
        }

        next();
    };