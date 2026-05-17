const express = require('express');
const router = express.Router();
const db = require('../middleware/db');

// ── GET /rentals/states ───────────────────────────────────────
router.get('/states', async (req, res) => {
    try {
        const rows = await db('data').distinct('state').orderBy('state');
        res.json(rows.map(r => r.state).filter(Boolean));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// ── GET /rentals/property-types ───────────────────────────────
router.get('/property-types', async (req, res) => {
    try {
        const rows = await db('data').distinct('propertyType').orderBy('propertyType');
        res.json(rows.map(r => r.propertyType).filter(Boolean));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// ── GET /rentals/search ───────────────────────────────────────
router.get('/search', async (req, res) => {
    try {
        const {
            state,
            suburb,
            postcode,
            propertyTypes,         // can be a single string or array
            minimumRent,
            maximumRent,
            minimumBedrooms,
            maximumBedrooms,
            minimumBathrooms,
            maximumBathrooms,
            minimumParking,
            sortBy = 'rent',
            sortDir = 'asc',
            page = 1,
        } = req.query;

        // Validate sortBy
        const allowedSortBy = ['rent', 'bedrooms', 'bathrooms', 'parkingSpaces', 'postcode', 'suburb', 'state', 'propertyType'];
        if (!allowedSortBy.includes(sortBy)) {
            return res.status(400).json({ error: true, message: `Invalid sortBy value. Must be one of: ${allowedSortBy.join(', ')}` });
        }
        if (!['asc', 'desc'].includes(sortDir)) {
            return res.status(400).json({ error: true, message: 'Invalid sortDir value. Must be asc or desc.' });
        }

        const pageNum = parseInt(page, 10) || 1;
        const perPage = 10;
        const offset = (pageNum - 1) * perPage;

        let query = db('data');

        if (state) query = query.where('state', state);
        if (suburb) query = query.whereIlike('suburb', `%${suburb}%`);
        if (postcode) query = query.where('postcode', postcode);

        // propertyTypes can come in as a comma-separated string or array
        if (propertyTypes) {
            const types = Array.isArray(propertyTypes) ? propertyTypes : propertyTypes.split(',');
            query = query.whereIn('propertyType', types);
        }

        if (minimumRent) query = query.where('rent', '>=', Number(minimumRent));
        if (maximumRent) query = query.where('rent', '<=', Number(maximumRent));
        if (minimumBedrooms) query = query.where('bedrooms', '>=', Number(minimumBedrooms));
        if (maximumBedrooms) query = query.where('bedrooms', '<=', Number(maximumBedrooms));
        if (minimumBathrooms) query = query.where('bathrooms', '>=', Number(minimumBathrooms));
        if (maximumBathrooms) query = query.where('bathrooms', '<=', Number(maximumBathrooms));
        if (minimumParking) query = query.where('parkingSpaces', '>=', Number(minimumParking));

        // Count total matching rows
        const [{ count }] = await query.clone().count('* as count');
        const total = parseInt(count, 10);
        const lastPage = Math.ceil(total / perPage);

        // Map sortBy key — client may send 'parking' but DB column is 'parkingSpaces'
        const sortByMap = { parking: 'parkingSpaces' };
        const dbSortBy = sortByMap[sortBy] || sortBy;

        // Fetch page
        const rows = await query
            .select(
                'id', 'title', 'rent', 'propertyType', 'suburb', 'state',
                'postcode', 'bedrooms', 'bathrooms', 'parkingSpaces as parking',
                'latitude', 'longitude'
            )
            .orderBy(dbSortBy, sortDir)
            .limit(perPage)
            .offset(offset);

        // Attach average ratings
        const ids = rows.map(r => r.id);
        let ratingMap = {};
        if (ids.length > 0) {
            const ratings = await db('ratings')
                .select('rentalId')
                .avg('rating as avgRating')
                .count('* as ratingCount')
                .whereIn('rentalId', ids)
                .groupBy('rentalId');
            ratings.forEach(r => {
                ratingMap[r.rentalId] = {
                    avgRating: parseFloat(Number(r.avgRating).toFixed(2)),
                    ratingCount: parseInt(r.ratingCount, 10),
                };
            });
        }

        const data = rows.map(r => ({
            ...r,
            avgRating: ratingMap[r.id]?.avgRating ?? null,
            ratingCount: ratingMap[r.id]?.ratingCount ?? 0,
        }));

        res.json({
            data,
            pagination: {
                total,
                lastPage,
                prevPage: pageNum > 1 ? pageNum - 1 : null,
                nextPage: pageNum < lastPage ? pageNum + 1 : null,
                perPage,
                currentPage: pageNum,
                from: offset,
                to: offset + rows.length,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

// ── GET /rentals/:id ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(id)) return res.status(400).json({ error: true, message: 'Invalid rental ID' });

        const rental = await db('data').where('id', id).first();
        if (!rental) return res.status(404).json({ error: true, message: 'Rental not found' });

        // Average rating + count
        const [ratingRow] = await db('ratings')
            .where('rentalId', id)
            .avg('rating as avgRating')
            .count('* as ratingCount');

        // All reviews for this rental
        const reviews = await db('ratings')
            .where('rentalId', id)
            .select('rating', 'comment', 'createdAt as dateTime')
            .join('users', 'ratings.userId', 'users.id')
            .select('users.email as user')
            .orderBy('createdAt', 'desc');

        res.json({
            id: rental.id,
            title: rental.title,
            rent: rental.rent,
            description: rental.description,
            propertyType: rental.propertyType,
            locality: rental.locality,
            latitude: rental.latitude,
            longitude: rental.longitude,
            postcode: rental.postcode,
            state: rental.state,
            streetAddress: rental.streetAddress,
            suburb: rental.suburb,
            bathrooms: rental.bathrooms,
            bedrooms: rental.bedrooms,
            parking: rental.parkingSpaces,
            agencyName: rental.agencyName,
            amenities: rental.amenities,
            avgRating: ratingRow.avgRating ? parseFloat(Number(ratingRow.avgRating).toFixed(2)) : null,
            ratingCount: parseInt(ratingRow.ratingCount, 10),
            reviews: reviews.map(r => ({
                rating: r.rating,
                user: r.user,
                ...(r.comment ? { comment: r.comment } : {}),
                dateTime: r.dateTime,
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

module.exports = router;