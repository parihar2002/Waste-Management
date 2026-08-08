const User = require('../models/User');
const Notification = require('../models/Notification');
const Reward = require('../models/Reward');

// @desc    Retrieve global rankings (Leaderboard)
// @route   GET /api/rewards/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'citizen' })
      .select('name points level badges avatar')
      .sort({ points: -1 })
      .limit(10); // Return top 10 recycling citizens

    res.status(200).json({
      success: true,
      leaderboard
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user notifications
// @route   GET /api/rewards/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/rewards/notifications/read
// @access  Private
const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeaderboard,
  getUserNotifications,
  markNotificationsRead
};
