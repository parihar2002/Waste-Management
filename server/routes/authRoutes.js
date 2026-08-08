const express = require('express');
const { registerUser, verifyOtp, loginUser, refreshAccessToken, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
router.get('/me', protect, getMe);

module.exports = router;
