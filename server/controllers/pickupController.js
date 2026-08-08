const PickupRequest = require('../models/PickupRequest');
const Notification = require('../models/Notification');
const { handleUpload } = require('../middleware/uploadMiddleware');

// Calculate reward points based on material type, weight (in kg), and urgency multiplier
const calculateRewards = (wasteType, urgency, weight = 1.0) => {
  const basePointsPerKg = {
    organic: 10,
    mixed: 8,
    plastic: 25,
    metal: 30,
    electronic: 40,
    medical: 50
  };

  const multipliers = {
    low: 1.0,
    medium: 1.2,
    high: 1.5,
    critical: 2.0
  };

  const baseRate = basePointsPerKg[wasteType.toLowerCase()] || 8;
  const mult = multipliers[urgency.toLowerCase()] || 1.2;

  // Points = Base Rate * Weight * Urgency Multiplier
  return Math.round(baseRate * weight * mult);
};

// @desc    Create a smart waste pickup request
// @route   POST /api/pickups
// @access  Private (Citizen)
const createPickup = async (req, res) => {
  try {
    const { wasteType, urgency, location, notes, scheduledTime, image, weight } = req.body;

    if (!wasteType || !location || !scheduledTime) {
      return res.status(400).json({ success: false, message: 'Please provide wasteType, location, and scheduledTime' });
    }

    const weightNum = parseFloat(weight) || 7.0;

    if (weightNum < 7.0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pickup requests are only allowed for waste weights of at least 7 kg to optimize fleet fuel efficiency.' 
      });
    }

    // Process image (either local fallback or Cloudinary link)
    const uploadedUrl = await handleUpload(image, wasteType);

    // Dynamic points engine based on waste type and weight
    const points = calculateRewards(wasteType, urgency || 'medium', weightNum);

    const pickup = await PickupRequest.create({
      citizen: req.user.id,
      wasteType,
      urgency: urgency || 'medium',
      weight: weightNum,
      location,
      notes,
      scheduledTime: new Date(scheduledTime),
      imageUrl: uploadedUrl,
      rewardPoints: points,
      status: 'pending'
    });

    // Create system notification for Citizen
    await Notification.create({
      recipient: req.user.id,
      title: 'Pickup Scheduled!',
      message: `Your ${wasteType} waste pickup has been registered. You will earn ${points} points on collection!`,
      type: 'pickup_status'
    });

    // Notify any listening admin/sockets if integrated
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      // Broadcast to admins
      io.to('admins').emit('pickup:created', pickup);
    }

    res.status(201).json({
      success: true,
      message: 'Pickup request registered successfully!',
      pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's pickup history / filter requests
// @route   GET /api/pickups
// @access  Private
const getPickups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Citizens only see their own requests
    if (req.user.role === 'citizen') {
      filter.citizen = req.user.id;
    }
    // Drivers only see their assigned or pending requests
    else if (req.user.role === 'driver') {
      if (req.query.assignedOnly === 'true') {
        filter.driver = req.user.id;
      } else {
        filter.$or = [{ driver: req.user.id }, { status: 'pending' }];
      }
    }

    // Query filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.wasteType) filter.wasteType = req.query.wasteType;
    if (req.query.urgency) filter.urgency = req.query.urgency;

    let pickups = await PickupRequest.find(filter)
      .populate('citizen', 'name email avatar phone')
      .populate('driver', 'name email avatar phone')
      .sort({ createdAt: -1 });

    // Enforce 7 km operating limit for drivers querying available jobs!
    if (req.user.role === 'driver' && req.query.latitude && req.query.longitude) {
      const dLat = parseFloat(req.query.latitude);
      const dLon = parseFloat(req.query.longitude);
      const { getHaversineDistance } = require('../utils/routeOptimizer');

      pickups = pickups.filter(p => {
        // Always allow their own active/assigned jobs to bypass the operating distance filter
        if (p.status !== 'pending' && p.driver && p.driver._id.toString() === req.user.id) {
          return true;
        }
        const dist = getHaversineDistance(dLat, dLon, p.location.latitude, p.location.longitude);
        return dist <= 7.0;
      });
    }

    // Apply pagination slice after filtering
    const slicedPickups = pickups.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: slicedPickups.length,
      total: pickups.length,
      pages: Math.ceil(pickups.length / limit),
      currentPage: page,
      pickups: slicedPickups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single pickup request
// @route   GET /api/pickups/:id
// @access  Private
const getPickupById = async (req, res) => {
  try {
    const pickup = await PickupRequest.findById(req.params.id)
      .populate('citizen', 'name email avatar phone level badges points')
      .populate('driver', 'name email avatar phone');

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found' });
    }

    // Auth validation
    if (req.user.role === 'citizen' && pickup.citizen._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this request' });
    }

    res.status(200).json({
      success: true,
      pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a pickup request
// @route   PATCH /api/pickups/:id/cancel
// @access  Private (Citizen/Admin)
const cancelPickup = async (req, res) => {
  try {
    const pickup = await PickupRequest.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found' });
    }

    if (req.user.role === 'citizen' && pickup.citizen.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (pickup.status === 'completed' || pickup.status === 'cancelled') {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${pickup.status} pickup` });
    }

    pickup.status = 'cancelled';
    await pickup.save();

    // Notify users
    await Notification.create({
      recipient: pickup.citizen,
      title: 'Pickup Cancelled',
      message: `Your waste pickup request scheduled for ${new Date(pickup.scheduledTime).toLocaleDateString()} has been cancelled.`,
      type: 'pickup_status'
    });

    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(`users:${pickup.citizen}`).emit('pickup:status:update', pickup);
    }

    res.status(200).json({
      success: true,
      message: 'Pickup request cancelled successfully',
      pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPickup,
  getPickups,
  getPickupById,
  cancelPickup
};
