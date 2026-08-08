const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate access tokens (short-lived: 15 minutes)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'fallback_access_secret_123',
    { expiresIn: '15m' }
  );
};

// Generate refresh tokens (long-lived: 7 days)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_123',
    { expiresIn: '7d' }
  );
};

// Core protection middleware
const protect = async (req, res, next) => {
  let token;

  // Read token from Authorization header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this resource' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_access_secret_123');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this token' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Your account has been banned' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }
};

// Role-Based Authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not authorized to access this endpoint`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
  generateAccessToken,
  generateRefreshToken
};
