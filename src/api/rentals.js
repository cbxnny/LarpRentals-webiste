import axios from 'axios';

const BASE = 'http://localhost:3000';

const api = axios.create({ baseURL: BASE });

export const getStates = () => api.get('/rentals/states');
export const getPropertyTypes = () => api.get('/rentals/property-types');

export const searchRentals = (params) => {
    const mapped = {};
    if (params.state) mapped.state = params.state;
    if (params.suburb) mapped.suburb = params.suburb;
    if (params.postcode) mapped.postcode = params.postcode;
    if (params.propertyType) mapped.propertyTypes = params.propertyType;
    if (params.minRent) mapped.minimumRent = params.minRent;
    if (params.maxRent) mapped.maximumRent = params.maxRent;
    if (params.minBedrooms) mapped.minimumBedrooms = params.minBedrooms;
    if (params.maxBedrooms) mapped.maximumBedrooms = params.maxBedrooms;
    if (params.minBaths) mapped.minimumBathrooms = params.minBaths;
    if (params.maxBaths) mapped.maximumBathrooms = params.maxBaths;
    if (params.minParking) mapped.minimumParking = params.minParking;
    if (params.sortBy) mapped.sortBy = params.sortBy;
    if (params.sortDir) mapped.sortOrder = params.sortDir;
    if (params.page) mapped.page = params.page;
    return api.get('/rentals/search', { params: mapped });
};

export const getRental = (id) => api.get(`/rentals/${id}`);

export const register = (email, password) =>
    api.post('/user/register', { email, password });

export const login = (email, password) =>
    api.post('/user/login', { email, password });

export const getRatedRentals = (token) =>
    api.get('/ratings', { headers: { Authorization: `Bearer ${token}` } });

export const getRating = (id, token) =>
    api.get(`/ratings/rentals/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const postRating = (id, rating, token, comment) => {
    const body = { rating };
    if (comment !== undefined && comment !== '') body.comment = comment;
    return api.post(`/ratings/rentals/${id}`, body, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const getProfile = (email, token) =>
    api.get(`/user/${encodeURIComponent(email)}/profile`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Cache-Control': 'no-cache',
        },
    });

export const updateProfile = (email, profileData, token) =>
    api.put(`/user/${encodeURIComponent(email)}/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` },
    });