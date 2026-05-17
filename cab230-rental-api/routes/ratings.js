const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { requireAuth } = require('../middleware/auth');

// ── POST /ratings/debugEraseRatings ──────────────────────────
router.post('/debugEraseRatings', async (req, res) => {
    try {
        await db('ratings').delete();
        res.json({ message: 'All ratings successfully erased.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// ── GET /ratings — all ratings by the logged-in user ─────────
router.get('/', requireAuth, async (req, res) => {
    try {
        const { email } = req.user;
        const page = parseInt(req.query.page, 10) || 1;
        const perPage = 20;
        const offset = (page - 1) * perPage;

        const user = await db('users').where('email', email).first();
        if (!user) return res.status(404).json({ error: true, message: 'User not found' });

        const [{ count }] = await db('ratings').where('userId', user.id).count('* as count');
        const total = parseInt(count, 10);
        const lastPage = Math.ceil(total / perPage) || 1;

        const rows = await db('ratings')
            .where('userId', user.id)
            .select('rentalId', 'rating', 'comment', 'createdAt as dateTime')
            .orderBy('createdAt', 'desc')
            .limit(perPage)
            .offset(offset);

        res.json({
            data: rows.map(r => ({
                rentalId: r.rentalId,
                rating: r.rating,
                ...(r.comment ? { comment: r.comment } : {}),
                dateTime: r.dateTime,
            })),
            pagination: {
                total,
                lastPage,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page < lastPage ? page + 1 : null,
                perPage,
                currentPage: page,
                from: offset,
                to: offset + rows.length,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// ── GET /ratings/rentals/:id — get logged-in user's rating for a rental ──────
router.get('/rentals/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ error: true, message: 'Invalid rental ID' });

    try {
        const { email } = req.user;
        const user = await db('users').where('email', email).first();
        if (!user) return res.status(404).json({ error: true, message: 'User not found' });

        const rental = await db('data').where('id', id).first();
        if (!rental) return res.status(404).json({ error: true, message: 'Rental not found' });

        const existing = await db('ratings')
            .where({ userId: user.id, rentalId: id })
            .first();

        if (!existing) {
            // No rating yet — return empty object
            return res.json({});
        }

        res.json({
            rating: existing.rating,
            ...(existing.comment ? { comment: existing.comment } : {}),
            dateTime: existing.createdAt,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// ── POST /ratings/rentals/:id — submit or update a rating ────
router.post('/rentals/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ error: true, message: 'Invalid rental ID' });

    const { rating, comment } = req.body;

    // Validate rating
    if (rating === undefined || rating === null) {
        return res.status(400).json({ error: true, message: 'Rating is required.' });
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: true, message: 'Invalid rating. Must be an integer between 1 and 5.' });
    }

    // Validate comment if provided
    if (comment !== undefined) {
        if (typeof comment !== 'string' || comment.length < 1 || comment.length > 2000) {
            return res.status(400).json({ error: true, message: 'Invalid comment parameter. Comment must be a string 1-2000 characters long.' });
        }
    }

    try {
        const { email } = req.user;
        const user = await db('users').where('email', email).first();
        if (!user) return res.status(404).json({ error: true, message: 'User not found' });

        const rental = await db('data').where('id', id).first();
        if (!rental) return res.status(404).json({ error: true, message: 'Rental not found' });

        const existing = await db('ratings').where({ userId: user.id, rentalId: id }).first();

        const now = new Date();
        if (existing) {
            // Update
            await db('ratings').where({ userId: user.id, rentalId: id }).update({
                rating: ratingNum,
                comment: comment ?? null,
                createdAt: now,
            });
        } else {
            // Insert
            await db('ratings').insert({
                userId: user.id,
                rentalId: id,
                rating: ratingNum,
                comment: comment ?? null,
                createdAt: now,
            });
        }

        res.json({
            message: existing ? 'Rating updated successfully.' : 'Rating added successfully.',
            rating: ratingNum,
            ...(comment ? { comment } : {}),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

module.exports = router;