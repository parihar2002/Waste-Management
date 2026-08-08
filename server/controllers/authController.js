const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../middleware/authMiddleware');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already registered with this email' });
    }

    // Generate simulated 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Create new user in inactive/verification mode
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'citizen',
      phone,
      otp: { code: otpCode, expiresAt: otpExpires }
    });

    console.log(`[OTP SIMULATION] Verification code for ${email} is: ${otpCode}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification code sent (Simulated in logs).',
      email: user.email,
      otpCode // Included here for simple testing/automation in the frontend
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify registration OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || user.otp.code !== code || new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    // Clear OTP and activate user
    user.otp = undefined;
    await user.save();

    // Create session tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account verified successfully!',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        badges: user.badges,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get tokens
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password & refreshToken
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Your account has been banned. Please contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Create session tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        badges: user.badges,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    // Find user by token
    const user = await User.findOne({ refreshToken }).select('+refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Verify token
    try {
      const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_123');
      if (decoded.id !== user._id.toString()) {
        throw new Error('Identity mismatch');
      }

      const newAccessToken = generateAccessToken(user);
      res.status(200).json({
        success: true,
        token: newAccessToken
      });
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Refresh token expired' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        badges: user.badges,
        avatar: user.avatar,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  verifyOtp,
  loginUser,
  refreshAccessToken,
  getMe
};
