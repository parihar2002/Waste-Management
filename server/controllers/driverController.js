const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');
const Reward = require('../models/Reward');
const Notification = require('../models/Notification');
const { optimizeRoute, getHaversineDistance } = require('../utils/routeOptimizer');
const { handleUpload } = require('../middleware/uploadMiddleware');

// Helper to award badges based on milestones
const evaluateBadges = (user, completedCount) => {
  const currentBadges = [...user.badges];
  let updated = false;

  const badgeMilestones = [
    { id: 'Eco Starter', condition: completedCount >= 1, label: 'Eco Starter (Completed 1st Pickup)' },
    { id: 'Green Warrior', condition: user.points >= 250, label: 'Green Warrior (Earned 250+ Points)' },
    { id: 'Recycling Titan', condition: completedCount >= 5, label: 'Recycling Titan (Completed 5 Pickups)' },
    { id: 'Zero Waste Legend', condition: user.points >= 600, label: 'Zero Waste Legend (Earned 600+ Points)' }
  ];

  for (const b of badgeMilestones) {
    if (b.condition && !currentBadges.includes(b.id)) {
      currentBadges.push(b.id);
      updated = true;
    }
  }

  return { currentBadges, updated };
};

// @desc    Accept a pending waste pickup request
// @route   PATCH /api/drivers/pickups/:id/accept
// @access  Private (Driver)
const acceptPickup = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const pickup = await PickupRequest.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found' });
    }

    if (pickup.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${pickup.status}` });
    }

    // Verify operating range (7 km limit) if driver coordinates are available
    if (latitude && longitude) {
      const distance = getHaversineDistance(
        latitude,
        longitude,
        pickup.location.latitude,
        pickup.location.longitude
      );

      if (distance > 7.0) {
        return res.status(400).json({
          success: false,
          message: `This collection request is located ${distance.toFixed(1)} km away, which exceeds your active 7 km operating limit.`
        });
      }
    }

    pickup.driver = req.user.id;
    pickup.status = 'assigned'; // Assigned to driver
    await pickup.save();

    // Notify Citizen
    await Notification.create({
      recipient: pickup.citizen,
      title: 'Driver Assigned!',
      message: `Driver ${req.user.name} has been assigned to collect your waste.`,
      type: 'driver_assigned'
    });

    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(`users:${pickup.citizen}`).emit('pickup:status:update', pickup);
      io.emit('driver:assigned', { pickupId: pickup._id, driverName: req.user.name });
    }

    res.status(200).json({
      success: true,
      message: 'Pickup accepted successfully!',
      pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark collection status as in-transit
// @route   PATCH /api/drivers/pickups/:id/transit
// @access  Private (Driver)
const startTransit = async (req, res) => {
  try {
    const pickup = await PickupRequest.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found' });
    }

    if (pickup.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized for this pickup' });
    }

    pickup.status = 'in-transit';
    await pickup.save();

    // Notify Citizen
    await Notification.create({
      recipient: pickup.citizen,
      title: 'Truck in Transit!',
      message: `Your pickup is underway. Track driver ${req.user.name} live on the map.`,
      type: 'pickup_status'
    });

    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(`users:${pickup.citizen}`).emit('pickup:status:update', pickup);
    }

    res.status(200).json({
      success: true,
      message: 'In-transit status activated.',
      pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete pickup, upload proof image and award rewards
// @route   PATCH /api/drivers/pickups/:id/complete
// @access  Private (Driver)
const completePickup = async (req, res) => {
  try {
    const { proofImage } = req.body;
    const pickup = await PickupRequest.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found' });
    }

    if (pickup.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized for this pickup' });
    }

    if (pickup.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Pickup is already completed' });
    }

    // Process completion photo
    const proofUrl = await handleUpload(proofImage, pickup.wasteType);

    pickup.status = 'completed';
    pickup.proofImageUrl = proofUrl;
    pickup.completedAt = Date.now();
    await pickup.save();

    // ** RECYCLING REWARDS ENGINE **
    const citizen = await User.findById(pickup.citizen);
    if (citizen) {
      // 1. Log rewards record
      await Reward.create({
        user: citizen._id,
        pointsEarned: pickup.rewardPoints,
        activityType: 'pickup_complete',
        referenceId: pickup._id
      });

      // 2. Add points
      citizen.points += pickup.rewardPoints;

      // 3. Level-up formula: 1 level per 200 points
      const currentLevel = Math.floor(citizen.points / 200) + 1;
      const leveledUp = currentLevel > citizen.level;
      citizen.level = currentLevel;

      // 4. Evaluate and assign badges
      const citizenPickupsCount = await PickupRequest.countDocuments({
        citizen: citizen._id,
        status: 'completed'
      });
      const badgeResults = evaluateBadges(citizen, citizenPickupsCount);
      citizen.badges = badgeResults.currentBadges;

      await citizen.save();

      // 5. Build notifications
      let notificationMsg = `Congratulations! You earned ${pickup.rewardPoints} points for your recycling request!`;
      if (leveledUp) {
        notificationMsg += ` You also leveled up to Level ${currentLevel}! 🎉`;
      }
      if (badgeResults.updated) {
        notificationMsg += ` New achievement badge unlocked! 🏅`;
      }

      await Notification.create({
        recipient: citizen._id,
        title: 'Recycling Rewards Dispatched!',
        message: notificationMsg,
        type: 'points_earned'
      });

      // 6. Emit real-time updates
      if (req.app.get('socketio')) {
        const io = req.app.get('socketio');
        io.to(`users:${citizen._id}`).emit('pickup:status:update', pickup);
        io.to(`users:${citizen._id}`).emit('rewards:update', {
          points: citizen.points,
          level: citizen.level,
          badges: citizen.badges,
          notification: notificationMsg
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Waste collection completed successfully and rewards disbursed!',
      pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Retrieve optimized driving sequences for assigned pickups
// @route   POST /api/drivers/optimize-routes
// @access  Private (Driver)
const getOptimizedRoutes = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Please provide driver coordinates (latitude, longitude)' });
    }

    // Get all assigned/accepted pickups for this driver
    const pickups = await PickupRequest.find({
      driver: req.user.id,
      status: { $in: ['assigned', 'accepted', 'in-transit'] }
    }).populate('citizen', 'name phone');

    // Run TSP nearest-neighbor sequence optimizer
    const optimized = optimizeRoute({ latitude, longitude }, pickups);

    res.status(200).json({
      success: true,
      count: optimized.length,
      optimized
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  acceptPickup,
  startTransit,
  completePickup,
  getOptimizedRoutes
};
