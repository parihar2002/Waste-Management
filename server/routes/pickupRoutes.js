const express = require('express');
const { createPickup, getPickups, getPickupById, cancelPickup } = require('../controllers/pickupController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect); // Secure all pickup endpoints

router.route('/')
  .post(createPickup)
  .get(getPickups);

router.route('/:id')
  .get(getPickupById);

router.patch('/:id/cancel', cancelPickup);

module.exports = router;
