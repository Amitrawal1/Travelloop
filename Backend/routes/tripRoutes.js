const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTrip,
  getTrips,
  getUpcomingTrips,
  getPreviousTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  addDay,
  deleteDay,
  addStop,
  updateStop,
  deleteStop,
  addBudgetItem,
  deleteBudgetItem,
  addPackingItem,
  togglePackingItem,
  deletePackingItem,
  addNote,
  deleteNote,
  generateShareLink,
  getPublicTrip,
  searchTrips
} = require('../controllers/tripController');

// Reject malformed ids with 404 instead of letting Mongoose throw a CastError (500)
for (const param of ['id', 'dayId', 'stopId', 'itemId', 'noteId']) {
  router.param(param, (req, res, next, value) => {
    if (!mongoose.isValidObjectId(value)) return res.status(404).json({ message: 'Not found' });
    next();
  });
}

// Public route (no auth)
router.get('/public/:shareCode', getPublicTrip);

// Protected routes (all below need JWT)
router.use(protect);

// Trip CRUD
router.post('/', createTrip);
router.get('/', getTrips);
router.get('/upcoming', getUpcomingTrips);
router.get('/previous', getPreviousTrips);
router.get('/search', searchTrips);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

// Itinerary (Days & Stops)
router.post('/:id/days', addDay);
router.delete('/:id/days/:dayId', deleteDay);
router.post('/:id/days/:dayId/stops', addStop);
router.put('/:id/days/:dayId/stops/:stopId', updateStop);
router.delete('/:id/days/:dayId/stops/:stopId', deleteStop);

// Budget
router.post('/:id/budget', addBudgetItem);
router.delete('/:id/budget/:category/:itemId', deleteBudgetItem);

// Packing Checklist
router.post('/:id/packing', addPackingItem);
router.put('/:id/packing/:itemId', togglePackingItem);
router.delete('/:id/packing/:itemId', deletePackingItem);

// Notes
router.post('/:id/notes', addNote);
router.delete('/:id/notes/:noteId', deleteNote);

// Share
router.post('/:id/share', generateShareLink);

module.exports = router;
