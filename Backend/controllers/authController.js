const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Case-insensitive exact match (emails are stored lowercased, but older accounts may not be)
const exactCI = (value) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

const signToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// The user object every auth/profile response sends back to the frontend
const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    hasPassword: Boolean(user.password),
});

const registerUser = async (req, res) => {
    try {
        const { password } = req.body;
        const name = (req.body.name || "").trim();
        const email = (req.body.email || "").trim().toLowerCase();

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email: exactCI(email) });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.password
                    ? "User already exists"
                    : "This email is registered with Google. Use Continue with Google instead.",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { password } = req.body;
        const identifier = (req.body.identifier || "").trim();

        if (!identifier || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        // Allow login via email OR username (name field)
        const user = await User.findOne({
            $or: [{ email: exactCI(identifier) }, { name: identifier }],
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        // Account was created with Google and has no password yet
        if (!user.password) {
            return res.status(400).json({
                message: "This account uses Google sign-in. Use Continue with Google.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        res.status(200).json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Checks a Google access token from the "Continue with Google" popup and returns the Google profile.
// The token must have been issued to our own client ID, otherwise any site's token would work here.
const fetchGoogleProfile = async (accessToken) => {
    const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    if (!infoRes.ok) return null;
    const info = await infoRes.json();
    if (info.aud !== process.env.GOOGLE_CLIENT_ID) return null;

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) return null;
    return profileRes.json();
};

const googleLogin = async (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(503).json({ message: "Google sign-in isn't set up on the server yet." });
        }

        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({ message: "Missing Google token" });
        }

        const profile = await fetchGoogleProfile(accessToken);
        if (!profile || !profile.sub || !profile.email) {
            return res.status(401).json({ message: "Google sign-in failed. Please try again." });
        }
        if (!profile.email_verified) {
            return res.status(401).json({ message: "Your Google email isn't verified." });
        }

        const email = profile.email.toLowerCase();

        // Existing Google user, or an email/password account with the same (Google-verified) email
        let user = await User.findOne({ googleId: profile.sub });
        if (!user) user = await User.findOne({ email: exactCI(email) });

        if (user) {
            let changed = false;
            if (!user.googleId) { user.googleId = profile.sub; changed = true; }
            if (!user.avatar && profile.picture) { user.avatar = profile.picture; changed = true; }
            if (changed) await user.save();
        } else {
            user = await User.create({
                name: profile.name || email.split("@")[0],
                email,
                googleId: profile.sub,
                avatar: profile.picture,
            });
        }

        res.status(200).json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    publicUser,
};
