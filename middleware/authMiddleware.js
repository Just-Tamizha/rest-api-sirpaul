const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
    const token = req.body.token;
    if (!token) return res.status(403).json({ error: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid token" });
        req.userId = decoded.userId;
        next();
    });
};
exports.verifyTokenWithHeaders = (ws, req, callback) => {
    const token = req.headers.token;
    if (!token) return ws.close(4001, 'Unauthorized');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return ws.close(4001, 'Unauthorized');
        req.userId = decoded.userId;
        if (callback) callback();
    });
};