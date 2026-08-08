const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');
const PDFDocument = require('pdfkit');

// @desc    Retrieve admin dashboard KPIs
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'citizen' });
    const activeDrivers = await User.countDocuments({ role: 'driver', status: 'active' });
    const pendingPickups = await PickupRequest.countDocuments({ status: 'pending' });
    const completedPickupsCount = await PickupRequest.countDocuments({ status: 'completed' });

    // Cleanliness score formula: 100 - (pending complaints + urgent requests weighted)
    // We compute a beautiful dynamic index out of 100
    const criticalPickupsCount = await PickupRequest.countDocuments({
      status: { $ne: 'completed' },
      urgency: { $in: ['high', 'critical'] }
    });
    const cleanlinessScore = Math.max(20, Math.min(100, 100 - pendingPickups * 2 - criticalPickupsCount * 5));

    // Retrieve active complaints mapping for interactive heatmap visualizers
    const activeComplaints = await PickupRequest.find(
      { status: { $ne: 'completed' } },
      'location.latitude location.longitude urgency wasteType'
    );

    const heatmapCoordinates = activeComplaints.map(item => ({
      latitude: item.location.latitude,
      longitude: item.location.longitude,
      weight: item.urgency === 'critical' ? 1.0 : item.urgency === 'high' ? 0.75 : 0.5,
      type: item.wasteType
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeDrivers,
        pendingPickups,
        completedPickups: completedPickupsCount,
        cleanlinessScore,
        heatmapCoordinates
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Retrieve system-wide analytics with Mongoose Aggregations
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getSystemAnalytics = async (req, res) => {
  try {
    // 1. Waste type distribution
    const wasteDistribution = await PickupRequest.aggregate([
      {
        $group: {
          _id: '$wasteType',
          count: { $sum: 1 },
          pointsAwarded: { $sum: '$rewardPoints' }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          pointsAwarded: 1,
          _id: 0
        }
      }
    ]);

    // 2. Weekly pickup completions trends
    const completionsTrend = await PickupRequest.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          completed: { $sum: 1 },
          points: { $sum: '$rewardPoints' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 15 },
      {
        $project: {
          date: '$_id',
          completed: 1,
          points: 1,
          _id: 0
        }
      }
    ]);

    // 3. Driver Performance analytics
    const driverPerformance = await PickupRequest.aggregate([
      {
        $match: { status: 'completed', driver: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$driver',
          totalCompleted: { $sum: 1 },
          avgPointsEarned: { $avg: '$rewardPoints' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'driverInfo'
        }
      },
      { $unwind: '$driverInfo' },
      {
        $project: {
          name: '$driverInfo.name',
          email: '$driverInfo.email',
          totalCompleted: 1,
          avgPointsEarned: { $round: ['$avgPointsEarned', 1] },
          _id: 0
        }
      },
      { $sort: { totalCompleted: -1 } }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        wasteDistribution,
        completionsTrend,
        driverPerformance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user account status (ban/unban)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'banned'

    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status type' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admins cannot be banned' });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User accounts status successfully updated to: ${status}`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign driver manually to request
// @route   PATCH /api/admin/pickups/:id/assign
// @access  Private (Admin)
const assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;

    const driver = await User.findOne({ _id: driverId, role: 'driver' });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Active driver not found with this ID' });
    }

    const pickup = await PickupRequest.findById(req.params.id);
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found' });
    }

    pickup.driver = driver._id;
    pickup.status = 'assigned';
    await pickup.save();

    res.status(200).json({
      success: true,
      message: `Pickup successfully dispatched to driver ${driver.name}`,
      pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Retrieve list of system users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsersList = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate PDF audit reports of the waste statistics
// @route   GET /api/admin/reports/pdf
// @access  Private (Admin)
const generatePdfReport = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'citizen' });
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const pendingCount = await PickupRequest.countDocuments({ status: 'pending' });
    const completedCount = await PickupRequest.countDocuments({ status: 'completed' });

    // Initialize PDFKit
    const doc = new PDFDocument({ margin: 50 });

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=ecosync_system_report.pdf');

    // Pipe layout
    doc.pipe(res);

    // Header title
    doc.fillColor('#16a34a')
      .fontSize(24)
      .text('EcoSync Smart Waste Management', { align: 'center' });
    doc.fillColor('#475569')
      .fontSize(12)
      .text('Official System Audit & Collection Analytics Report', { align: 'center' });
    doc.moveDown(1.5);

    // Horizontal divider line
    doc.strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(1.5);

    // Section 1: Executive KPI Metrics
    doc.fillColor('#0f172a').fontSize(16).text('1. Executive KPI Summary', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor('#334155');
    doc.text(`* Total EcoSync Citizen Accounts: ${totalUsers}`);
    doc.text(`* Enlisted Field Drivers: ${totalDrivers}`);
    doc.text(`* Pending Collections Awaiting Dispatch: ${pendingCount}`);
    doc.text(`* Total Completed Recycles (Points Disbursed): ${completedCount}`);
    doc.moveDown(1.5);

    // Section 2: Waste Type Aggregations
    doc.fillColor('#0f172a').fontSize(16).text('2. Collection Material Density Breakdown', { underline: true });
    doc.moveDown(0.5);

    const wasteCounts = await PickupRequest.aggregate([
      { $group: { _id: '$wasteType', total: { $sum: 1 } } }
    ]);

    doc.fontSize(12).fillColor('#334155');
    if (wasteCounts.length === 0) {
      doc.text('No active waste collections logged in database.');
    } else {
      wasteCounts.forEach(item => {
        doc.text(`- Material: ${item._id.toUpperCase()} | total collections logged: ${item.total}`);
      });
    }

    doc.moveDown(2);

    // Footer signature
    doc.fillColor('#64748b')
      .fontSize(10)
      .text(`Report Generated On: ${new Date().toLocaleString()}`, { align: 'right' })
      .text('EcoSync Automated Administrator Panel', { align: 'right' });

    // End stream
    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getSystemAnalytics,
  updateUserStatus,
  assignDriver,
  getUsersList,
  generatePdfReport
};
