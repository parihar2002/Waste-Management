const express = require('express');
const { getLeaderboard, getUserNotifications, markNotificationsRead } = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect); // Secure all endpoints

router.get('/leaderboard', getLeaderboard);
router.get('/notifications', getUserNotifications);
router.patch('/notifications/read', markNotificationsRead);

module.exports = router;
