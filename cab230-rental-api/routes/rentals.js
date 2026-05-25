const express = require('express');
const router = express.Router();
const db = require('../middleware/db');

router.get('/states', async (req, res) => {
    try {
        const rows = await db('rentals').distinct('state').orderBy('state');
        res.json(rows.map(r => r.state).filter(Boolean));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

router.get('/property-types', async (req, res) => {
    try {
        const rows = await db('rentals').distinct('propertyType').orderBy('propertyType');
        res.json(rows.map(r => r.propertyType).filter(Boolean));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

router.get('/search', async (req, res) => {
    try {
        const {
            state, suburb, postcode, propertyTypes,
            minimumRent, maximumRent,
            minimumBedrooms, maximumBedrooms,
            minimumBathrooms, maximumBathrooms,
            minimumParking, maximumParking,
            sortBy, page = 1,
        } = req.query;

        // Accept both sortOrder (spec) and sortDir (React app) for compatibility
        const sortOrder = req.query.sortOrder || req.query.sortDir || 'asc';

        const allowedSortBy = ['id', 'title', 'rent', 'propertyType', 'latitude', 'longitude', 'postcode', 'state', 'suburb', 'bathrooms', 'bedrooms', 'parkingSpaces', 'averageRating', 'numRatings'];

        if (sortBy && !allowedSortBy.includes(sortBy)) {
            return res.status(400).json({ error: true, message: 'Invalid sortBy parameter. Must refer to a valid sortable property.' });
        }
        if (!['asc', 'desc'].includes(sortOrder)) {
            return res.status(400).json({ error: true, message: "Invalid sortOrder parameter. Must be 'asc' or 'desc'." });
        }

        const pageNum = parseInt(page, 10) || 1;
        if (pageNum < 1) {
            return res.status(400).json({ error: true, message: 'Invalid page parameter. Must be an integer greater than or equal to 1.' });
        }

        const perPage = 10;
        const offset = (pageNum - 1) * perPage;

        let query = db('rentals');

        if (state) query = query.where('state', state);
        if (suburb) query = query.whereIlike('suburb', `%${suburb}%`);
        if (postcode) query = query.where('postcode', postcode);
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
        if (maximumParking) query = query.where('parkingSpaces', '<=', Number(maximumParking));

        const [{ count }] = await query.clone().count('* as count');
        const total = parseInt(count, 10);
        const lastPage = Math.ceil(total / perPage) || 1;

        const dbSortBy = sortBy || 'id';
        const sortColumn = dbSortBy === 'id' ? 'rentals.id' : dbSortBy;

        const rows = await query.clone()
            .leftJoin('ratings', 'rentals.id', 'ratings.rental_id')
            .select('rentals.id as id', 'title', 'rent', 'propertyType', 'suburb', 'state', 'postcode', 'bedrooms', 'bathrooms', 'parkingSpaces', 'latitude', 'longitude')
            .avg('ratings.rating as averageRating')
            .count('ratings.id as numRatings')
            .groupBy('rentals.id')
            .orderBy(sortColumn, sortOrder)
            .limit(perPage)
            .offset(offset);

        res.json({
            data: rows.map(r => ({
                ...r,
                averageRating: r.averageRating ? parseFloat(Number(r.averageRating).toFixed(2)) : null,
                numRatings: parseInt(r.numRatings, 10),
            })),
            pagination: {
                total, lastPage,
                prevPage: pageNum > 1 ? pageNum - 1 : null,
                nextPage: pageNum < lastPage ? pageNum + 1 : null,
                perPage, currentPage: pageNum,
                from: offset, to: offset + rows.length,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Database error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(id)) return res.status(400).json({ error: true, message: 'Invalid rental ID' });

        const rental = await db('rentals').where('id', id).first();
        if (!rental) return res.status(404).json({ error: true, message: 'No rental exists with this ID.' });

        const [ratingRow] = await db('ratings').where('rental_id', id).avg('rating as avgRating').count('* as numRatings');

        const reviews = await db('ratings')
            .where('ratings.rental_id', id)
            .join('users', 'ratings.user_id', 'users.id')
            .select('ratings.rating', 'users.email as user', 'ratings.comment', 'ratings.created_at as dateTime')
            .orderBy('ratings.created_at', 'desc');

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
            parkingSpaces: rental.parkingSpaces,
            agencyName: rental.agencyName,
            amenities: rental.amenities,
            averageRating: ratingRow.avgRating ? parseFloat(Number(ratingRow.avgRating).toFixed(2)) : null,
            numRatings: parseInt(ratingRow.numRatings, 10),
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