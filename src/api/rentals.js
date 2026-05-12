import axios from 'axios';

const BASE = 'http://4.237.58.241:3000';

export const getStates = () => axios.get(`${BASE}/rentals/states`);
export const getPropertyTypes = () => axios.get(`${BASE}/rentals/property-types`);
export const searchRentals = (params) => {
    const mapped = {
        suburb: params.suburb,
        state: params.state,
        postcode: params.postcode,
        minimumRent: params.minRent,
        maximumRent: params.maxRent,
        minimumBedrooms: params.minBedrooms,
        maximumBedrooms: params.maxBeds,
        minimumBathrooms: params.minBaths,
        minimumParking: params.minParking,
        propertyTypes: params.propertyType ? [params.propertyType] : undefined,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
        page: params.page,
    };

    Object.keys(mapped).forEach(k => mapped[k] === undefined && delete mapped[k]);
    return axios.get(`${BASE}/rentals/search`, { params: mapped });
};

export const getRental = (id) => axios.get(`${BASE}/rentals/${id}`);

export const register = (email, password) =>
    axios.post(`${BASE}/user/register`, { email, password });

export const login = (email, password) =>
    axios.post(`${BASE}/user/login`, { email, password });

export const getRatedRentals = (token) =>
    axios.get(`${BASE}/ratings`, { headers: { Authorization: `Bearer ${token}` } });

export const getRating = (id, token) =>
    axios.get(`${BASE}/ratings/rentals/${id}`, { headers: { Authorization: `Bearer ${token}` } });


export const postRating = (id, rating, token, comment) => {
    const body = { rating };
    if (comment !== undefined && comment !== '') body.comment = comment;
    return axios.post(`${BASE}/ratings/rentals/${id}`, body, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// profile
export const getProfile = (email, token) =>
    axios.get(`${BASE}/user/${encodeURIComponent(email)}/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

export const updateProfile = (email, profileData, token) =>
    axios.put(`${BASE}/user/${encodeURIComponent(email)}/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
    });