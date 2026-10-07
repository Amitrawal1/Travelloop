const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        // Not set for accounts created with "Continue with Google" until the user adds one
        password: {
            type: String,
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        avatar: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "User",
    userSchema
);
