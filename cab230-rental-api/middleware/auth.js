const jwt = require('jsonwebtoken');

// ── Helpers 
function extractToken(req) {
    const header = req.headers['authorization'];
    if (!header) return { token: null, error: null }; // no header at all
    if (!header.startsWith('Bearer ')) {
        return { token: null, error: { status: 401, message: 'Authorization header is malformed' } };
    }
    return { token: header.slice(7), error: null };
}

function verifyToken(token) {
    try {
        return { payload: jwt.verify(token, process.env.JWT_SECRET), error: null };
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return { payload: null, error: { status: 401, message: 'JWT token has expired' } };
        }
        return { payload: null, error: { status: 401, message: 'Invalid JWT token' } };
    }
}


function requireAuth(req, res, next) {
    const { token, error: extractError } = extractToken(req);

    if (extractError) return res.status(extractError.status).json({ error: true, message: extractError.message });

    if (!token) {
        return res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
    }

    const { payload, error: verifyError } = verifyToken(token);
    if (verifyError) return res.status(verifyError.status).json({ error: true, message: verifyError.message });

    req.user = payload;
    next();
}

// ── Middleware: 
function optionalAuth(req, res, next) {
    const { token, error: extractError } = extractToken(req);

    if (extractError) return res.status(extractError.status).json({ error: true, message: extractError.message });

    if (!token) {
        req.user = null;
        return next();
    }

    const { payload, error: verifyError } = verifyToken(token);
    if (verifyError) return res.status(verifyError.status).json({ error: true, message: verifyError.message });

    req.user = payload;
    next();
}

module.exports = { requireAuth, optionalAuth };