require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const rentalsRouter = require('./routes/rentals');
const ratingsRouter = require('./routes/ratings');
const userRouter = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Swagger docs at /docs ─────────────────────────────────────
const swaggerDocument = require('./rentals-openapi.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Routes ────────────────────────────────────────────────────
app.use('/rentals', rentalsRouter);
app.use('/ratings', ratingsRouter);
app.use('/user', userRouter);

// ── 404 fallback ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: true, message: 'Route not found' });
});


http.createServer(app).listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/docs`);
});

const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
    };
    https.createServer(httpsOptions, app).listen(443, () => {
        console.log('HTTPS server running on port 443');
    });
} else {
    console.warn('No cert.pem/key.pem found — HTTPS disabled. Run: openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes');
}

module.exports = app;