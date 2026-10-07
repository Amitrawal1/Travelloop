// Local development entry point. On Vercel, api/index.js exports the same app as a serverless function.
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB()
  .catch((err) => console.error('Database connection failed:', err.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
