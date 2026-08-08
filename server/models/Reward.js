const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pointsEarned: {
    type: Number,
    required: true
  },
  activityType: {
    type: String,
    enum: ['pickup_complete', 'streak_bonus'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PickupRequest'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reward', rewardSchema);
