const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Citizen ID is required'],
    index: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  wasteType: {
    type: String,
    enum: ['plastic', 'organic', 'electronic', 'medical', 'metal', 'mixed'],
    required: [true, 'Waste type is required']
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [7.0, 'Weight must be at least 7.0 kg to schedule a pickup'],
    default: 7.0
  },
  imageUrl: {
    type: String
  },
  location: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'accepted', 'in-transit', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  proofImageUrl: {
    type: String
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);
