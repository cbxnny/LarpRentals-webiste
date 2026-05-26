const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../middleware/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const SALT_ROUNDS = 10;

function formatDob(value) {
    if (value == null) return null;
    if (typeof value === 'string') return value.slice(0, 10);
    const d = value instanceof Date ? value : new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function isRealDateString(dob) {
    if (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
    const [y, m, d] = dob.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function isPastDateString(dob) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return dob < today;
}

// Helper: generate JWT  
function generateToken(email, expiresIn = '24h') {
    return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn });
}

// POST /user/register 
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: true, message: 'Request body incomplete — email and password are required.' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: true, message: 'Request body invalid — email and password must be strings.' });
    }

    try {
        const existing = await db('users').where('email', email).first();
        if (existing) {
            return res.status(409).json({ error: true, message: 'User already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        await db('users').insert({
            email,
            passwordHash,
            firstName: null,
            lastName: null,
            dob: null,
            address: null,
        });

        res.status(201).json({ message: 'User created.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// POST /user/login 
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: true, message: 'Request body incomplete — email and password are required.' });
    }

    try {
        const user = await db('users').where('email', email).first();
        if (!user) {
            return res.status(401).json({ error: true, message: 'Incorrect email or password.' });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: true, message: 'Incorrect email or password.' });
        }

        const token = generateToken(email);
        res.json({ token, tokenType: 'Bearer', expiresIn: 86400 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// POST /user/debugLogin 
router.post('/debugLogin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: true, message: 'Request body incomplete — email and password are required.' });
    }

    try {
        const user = await db('users').where('email', email).first();
        if (!user) {
            return res.status(401).json({ error: true, message: 'Incorrect email or password.' });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: true, message: 'Incorrect email or password.' });
        }

        const token = generateToken(email, '1s');
        res.json({ token, tokenType: 'Bearer', expiresIn: 1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// GET /user/:email/profile 
router.get('/:email/profile', optionalAuth, async (req, res) => {
    const { email } = req.params;

    try {
        const user = await db('users').where('email', email).first();
        if (!user) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        // If the authenticated user is viewing their own profile, return full details
        const isOwner = req.user && req.user.email === email;

        if (isOwner) {
            return res.json({
                email: user.email,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                dob: formatDob(user.dob),
                address: user.address ?? null,
            });
        }

        // Public view — no dob or address
        return res.json({
            email: user.email,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// ── PUT /user/:email/profile 
router.put('/:email/profile', requireAuth, async (req, res) => {
    const { email } = req.params;
    const { firstName, lastName, dob, address } = req.body;

    // Must be updating own profile
    if (req.user.email !== email) {
        return res.status(403).json({ error: true, message: 'Forbidden' });
    }

    // All fields required
    if (firstName === undefined || lastName === undefined || dob === undefined || address === undefined) {
        return res.status(400).json({ error: true, message: 'Request body incomplete: firstName, lastName, dob and address are required.' });
    }

    // All must be strings
    if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof address !== 'string') {
        return res.status(400).json({ error: true, message: 'Request body invalid: firstName, lastName and address must be strings only.' });
    }

    if (!isRealDateString(dob)) {
        return res.status(400).json({ error: true, message: 'Invalid input: dob must be a real date in format YYYY-MM-DD.' });
    }
    if (!isPastDateString(dob)) {
        return res.status(400).json({ error: true, message: 'Invalid input: dob must be a date in the past.' });
    }

    try {
        const user = await db('users').where('email', email).first();
        if (!user) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        await db('users').where('email', email).update({ firstName, lastName, dob, address });

        res.json({ email, firstName, lastName, dob, address });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

module.exports = router;