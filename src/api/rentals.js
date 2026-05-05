import axios from 'axios';

const BASE = 'http://4.237.58.241:3000';

export const getStates = () => axios.get(`${BASE}/rentals/states`);
export const getPropertyTypes = () => axios.get(`${BASE}/rentals/property-types`);
export const searchRentals = (params) => axios.get(`${BASE}/rentals/search`, { params });
export const getRental = (id) => axios.get(`${BASE}/rentals/${id}`);

export const register = (email, password) =>
    axios.post(`${BASE}/user/register`, { email, password });

export const login = (email, password) =>
    axios.post(`${BASE}/user/login`, { email, password });

export const getRatedRentals = (token) =>
    axios.get(`${BASE}/ratings`, { headers: { Authorization: `Bearer ${token}` } });

export const getRating = (id, token) =>
    axios.get(`${BASE}/ratings/rentals/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const postRating = (id, rating, token) =>
    axios.post(`${BASE}/ratings/rentals/${id}`, { rating }, { headers: { Authorization: `Bearer ${token}` } });