import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── AUTH ─────────────────────────────
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);

// ─── USER ─────────────────────────────
export const getProfile = () => api.get('/user/profile');
export const updateProfile = (data) => api.put('/user/profile', data);
export const changePassword = (data) => api.put('/user/password', data);

// ─── TRIPS ────────────────────────────
export const createTrip = (data) => api.post('/trips', data);
export const getTrips = () => api.get('/trips');
export const getUpcomingTrips = () => api.get('/trips/upcoming');
export const getPreviousTrips = () => api.get('/trips/previous');
export const searchTrips = (q) => api.get(`/trips/search?q=${encodeURIComponent(q)}`);
export const getTripById = (id) => api.get(`/trips/${id}`);
export const updateTrip = (id, data) => api.put(`/trips/${id}`, data);
export const deleteTrip = (id) => api.delete(`/trips/${id}`);

// ─── ITINERARY ────────────────────────
export const addDay = (tripId, data) => api.post(`/trips/${tripId}/days`, data);
export const addStop = (tripId, dayId, data) => api.post(`/trips/${tripId}/days/${dayId}/stops`, data);
export const updateStop = (tripId, dayId, stopId, data) => api.put(`/trips/${tripId}/days/${dayId}/stops/${stopId}`, data);
export const deleteStop = (tripId, dayId, stopId) => api.delete(`/trips/${tripId}/days/${dayId}/stops/${stopId}`);

// ─── BUDGET ───────────────────────────
export const addBudgetItem = (tripId, data) => api.post(`/trips/${tripId}/budget`, data);
export const deleteBudgetItem = (tripId, category, itemId) => api.delete(`/trips/${tripId}/budget/${category}/${itemId}`);

// ─── PACKING ──────────────────────────
export const addPackingItem = (tripId, data) => api.post(`/trips/${tripId}/packing`, data);
export const togglePackingItem = (tripId, itemId) => api.put(`/trips/${tripId}/packing/${itemId}`);
export const deletePackingItem = (tripId, itemId) => api.delete(`/trips/${tripId}/packing/${itemId}`);

// ─── NOTES ────────────────────────────
export const addNote = (tripId, data) => api.post(`/trips/${tripId}/notes`, data);
export const deleteNote = (tripId, noteId) => api.delete(`/trips/${tripId}/notes/${noteId}`);

// ─── AI DISCOVERY ─────────────────────
export const generateSuggestions = (data) => api.post('/ai/generate', data);
export const getDestinations = () => api.get('/ai/destinations');

// ─── SHARE ────────────────────────────
export const generateShareLink = (tripId) => api.post(`/trips/${tripId}/share`);
export const getPublicTrip = (shareCode) => api.get(`/trips/public/${shareCode}`);

export default api;
