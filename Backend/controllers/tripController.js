const Trip = require('../models/Trip');
const crypto = require('crypto');

// Trips are "upcoming" until their end date has passed (dates are stored as YYYY-MM-DD strings).
const todayISO = () => new Date().toISOString().slice(0, 10);

// ─── TRIP CRUD ────────────────────────────────────────────

// @desc   Create a new trip
// @route  POST /api/trips
const createTrip = async (req, res) => {
  try {
    const { name, destination, startDate, endDate, description, image, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Trip name is required' });
    }

    const trip = await Trip.create({
      user: req.user._id,
      name,
      destination: destination || '',
      startDate: startDate || '',
      endDate: endDate || '',
      description: description || '',
      image: image || '',
      status: status || 'upcoming',
      days: [],
      budget: { transport: [], accommodation: [], activities: [] },
      packingList: [],
      notes: []
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all trips for logged-in user
// @route  GET /api/trips
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get upcoming trips
// @route  GET /api/trips/upcoming
const getUpcomingTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      user: req.user._id,
      status: { $ne: 'previous' },
      $or: [{ endDate: '' }, { endDate: { $gte: todayISO() } }]
    }).sort({ startDate: 1, createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get previous trips
// @route  GET /api/trips/previous
const getPreviousTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      user: req.user._id,
      $or: [{ status: 'previous' }, { endDate: { $ne: '', $lt: todayISO() } }]
    }).sort({ endDate: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get single trip by ID
// @route  GET /api/trips/:id
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update a trip
// @route  PUT /api/trips/:id
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const { name, destination, startDate, endDate, description, image, status, isActive } = req.body;

    if (name !== undefined) trip.name = name;
    if (destination !== undefined) trip.destination = destination;
    if (startDate !== undefined) trip.startDate = startDate;
    if (endDate !== undefined) trip.endDate = endDate;
    if (description !== undefined) trip.description = description;
    if (image !== undefined) trip.image = image;
    if (status !== undefined) trip.status = status;
    if (isActive !== undefined) trip.isActive = isActive;

    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete a trip
// @route  DELETE /api/trips/:id
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ITINERARY (DAYS & STOPS) ─────────────────────────────

// @desc   Add a day to a trip
// @route  POST /api/trips/:id/days
const addDay = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const dayNumber = trip.days.length + 1;
    const { date } = req.body;

    trip.days.push({ dayNumber, date: date || '', stops: [] });
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete a day (remaining days are renumbered)
// @route  DELETE /api/trips/:id/days/:dayId
const deleteDay = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const day = trip.days.id(req.params.dayId);
    if (!day) return res.status(404).json({ message: 'Day not found' });

    day.deleteOne();
    trip.days.forEach((d, i) => { d.dayNumber = i + 1; });
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Add a stop to a day
// @route  POST /api/trips/:id/days/:dayId/stops
const addStop = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const day = trip.days.id(req.params.dayId);
    if (!day) return res.status(404).json({ message: 'Day not found' });

    const { title, time, type, notes } = req.body;
    if (!title) return res.status(400).json({ message: 'Stop title is required' });

    day.stops.push({ title, time: time || '', type: type || 'activity', notes: notes || '' });
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update a stop in a day
// @route  PUT /api/trips/:id/days/:dayId/stops/:stopId
const updateStop = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const day = trip.days.id(req.params.dayId);
    if (!day) return res.status(404).json({ message: 'Day not found' });

    const stop = day.stops.id(req.params.stopId);
    if (!stop) return res.status(404).json({ message: 'Stop not found' });

    const { title, time, type, notes } = req.body;
    if (title !== undefined) stop.title = title;
    if (time !== undefined) stop.time = time;
    if (type !== undefined) stop.type = type;
    if (notes !== undefined) stop.notes = notes;

    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete a stop
// @route  DELETE /api/trips/:id/days/:dayId/stops/:stopId
const deleteStop = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const day = trip.days.id(req.params.dayId);
    if (!day) return res.status(404).json({ message: 'Day not found' });

    day.stops.pull(req.params.stopId);
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── BUDGET ───────────────────────────────────────────────

// @desc   Add a budget item
// @route  POST /api/trips/:id/budget
const addBudgetItem = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { category, name, amount } = req.body;
    if (!category || !name) return res.status(400).json({ message: 'Category and name are required' });

    if (!['transport', 'accommodation', 'activities'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category. Use: transport, accommodation, or activities' });
    }

    trip.budget[category].push({ name, amount: amount || 0 });
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete a budget item
// @route  DELETE /api/trips/:id/budget/:category/:itemId
const deleteBudgetItem = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { category, itemId } = req.params;
    if (!trip.budget[category]) return res.status(400).json({ message: 'Invalid category' });

    trip.budget[category].pull(itemId);
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PACKING CHECKLIST ────────────────────────────────────

// @desc   Add a packing item
// @route  POST /api/trips/:id/packing
const addPackingItem = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { item } = req.body;
    if (!item) return res.status(400).json({ message: 'Item name is required' });

    trip.packingList.push({ item, checked: false });
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Toggle packing item checked
// @route  PUT /api/trips/:id/packing/:itemId
const togglePackingItem = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const packItem = trip.packingList.id(req.params.itemId);
    if (!packItem) return res.status(404).json({ message: 'Packing item not found' });

    packItem.checked = !packItem.checked;
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete packing item
// @route  DELETE /api/trips/:id/packing/:itemId
const deletePackingItem = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.packingList.pull(req.params.itemId);
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NOTES / JOURNAL ──────────────────────────────────────

// @desc   Add a note
// @route  POST /api/trips/:id/notes
const addNote = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Note content is required' });

    trip.notes.push({ content, updatedAt: new Date() });
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete a note
// @route  DELETE /api/trips/:id/notes/:noteId
const deleteNote = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.notes.pull(req.params.noteId);
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── SHARE ────────────────────────────────────────────────

// @desc   Generate share link for a trip
// @route  POST /api/trips/:id/share
const generateShareLink = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (!trip.shareCode) {
      trip.shareCode = crypto.randomBytes(6).toString('hex');
    }
    trip.isPublic = true;
    await trip.save();

    res.json({
      shareCode: trip.shareCode,
      shareUrl: `${process.env.CLIENT_URL || req.get('origin') || ''}/t/${trip.shareCode}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get a public trip by share code (no auth needed)
// @route  GET /api/trips/public/:shareCode
const getPublicTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ shareCode: req.params.shareCode, isPublic: true })
      .populate('user', 'name');
    if (!trip) {
      return res.status(404).json({ message: 'Shared trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── SEARCH ───────────────────────────────────────────────

// @desc   Search trips by name or destination
// @route  GET /api/trips/search?q=keyword
const searchTrips = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const trips = await Trip.find({
      user: req.user._id,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { destination: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
