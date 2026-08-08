const express = require('express');
const {
  getDashboardStats,
  getSystemAnalytics,
  updateUserStatus,
  assignDriver,
  getUsersList,
  generatePdfReport
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // Restrict endpoints strictly to admin accounts

router.get('/dashboard-stats', getDashboardStats);
router.get('/analytics', getSystemAnalytics);
router.get('/users', getUsersList);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/pickups/:id/assign', assignDriver);
router.get('/reports/pdf', generatePdfReport);

module.exports = router;
