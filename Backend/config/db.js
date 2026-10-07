const mongoose = require("mongoose");

// Cache the connection promise so serverless invocations (Vercel) reuse one connection
// instead of opening a new one on every request.
let connecting = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (connecting) return connecting;

    connecting = (async () => {
        try {
            await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
            console.log("MongoDB Connected");
            return mongoose.connection;
        } catch (err) {
            // Production must use a real database; never fall back to a throwaway one.
            if (process.env.NODE_ENV === "production" || process.env.VERCEL) throw err;

            console.warn("Could not connect to MONGO_URI:", err.message);
            console.log("Starting local in-memory MongoDB server (development only)...");
            const { MongoMemoryServer } = require("mongodb-memory-server");
            const mongoServer = await MongoMemoryServer.create();
            await mongoose.connect(mongoServer.getUri());
            console.log("MongoDB In-Memory Server Connected. Data will be lost when the server restarts.");
            return mongoose.connection;
        }
    })();

    try {
        return await connecting;
    } catch (err) {
        connecting = null; // allow a retry on the next request
        throw err;
    }
};

module.exports = connectDB;
