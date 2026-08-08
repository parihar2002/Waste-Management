const express = require('express');
const { acceptPickup, startTransit, completePickup, getOptimizedRoutes } = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);
router.use(authorize('driver')); // Strictly restrict to Driver roles

router.patch('/pickups/:id/accept', acceptPickup);
router.patch('/pickups/:id/transit', startTransit);
router.patch('/pickups/:id/complete', completePickup);
router.post('/optimize-routes', getOptimizedRoutes);

module.exports = router;
