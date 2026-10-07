const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  // Token is valid but the account no longer exists
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, user not found' });
  }
  next();
};

module.exports = { protect };
