require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// CORS: in production only the configured frontend origin(s) may call the API.
// CLIENT_URL can be a comma-separated list, e.g. "https://travelloop.vercel.app,https://www.travelloop.app"
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));

// Make sure the database is connected before any API route runs (connection is cached between requests).
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' });
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

module.exports = app;
