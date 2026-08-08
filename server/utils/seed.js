const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');
const Reward = require('../models/Reward');
const Notification = require('../models/Notification');

const seedSystemData = async () => {
  try {
    // Check if system already populated
    const usersCount = await User.countDocuments();
    if (usersCount > 0) {
      console.log('[SEEDER] Database already populated. Skipping database seeding.');
      return;
    }

    console.log('[SEEDER] Blank database detected. Launching automated seed system...');

    // 1. Create standard demo accounts
    const citizen = await User.create({
      name: 'Sarah Green (Citizen)',
      email: 'citizen@ecosync.com',
      password: 'password123',
      role: 'citizen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      points: 150,
      level: 1,
      badges: ['Eco Starter'],
      phone: '+91 9876543210'
    });

    const driver = await User.create({
      name: 'James Carter (Driver)',
      email: 'driver@ecosync.com',
      password: 'password123',
      role: 'driver',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      phone: '+91 9988776655'
    });

    const admin = await User.create({
      name: 'Chief Admin EcoSync',
      email: 'admin@ecosync.com',
      password: 'password123',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
    });

    console.log('[SEEDER] Standard Citizen, Driver, and Admin demo accounts created!');

    // 2. Create sample pickup requests situated in Delhi coordinates
    const pickup1 = await PickupRequest.create({
      citizen: citizen._id,
      wasteType: 'plastic',
      urgency: 'high',
      location: {
        address: 'Connaught Place, Block E, New Delhi',
        latitude: 28.6304,
        longitude: 77.2177
      },
      status: 'pending',
      notes: 'Near the central park flag post, big blue bag',
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      rewardPoints: 60
    });

    const pickup2 = await PickupRequest.create({
      citizen: citizen._id,
      driver: driver._id,
      wasteType: 'organic',
      urgency: 'medium',
      location: {
        address: 'Lodhi Gardens Entrance gate, New Delhi',
        latitude: 28.5933,
        longitude: 77.2189
      },
      status: 'in-transit',
      notes: 'Biodegradable vegetable waste from canteen',
      scheduledTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // in 12 hours
      rewardPoints: 24
    });

    const pickup3 = await PickupRequest.create({
      citizen: citizen._id,
      driver: driver._id,
      wasteType: 'electronic',
      urgency: 'critical',
      location: {
        address: 'Hauz Khas Village Metro gate, New Delhi',
        latitude: 28.5494,
        longitude: 77.2001
      },
      status: 'completed',
      notes: 'Damaged printer toner cartridges and batteries',
      scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // completed yesterday
      rewardPoints: 160,
      completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      proofImageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=600'
    });

    console.log('[SEEDER] Delhi coordinates pickup requests created!');

    // 3. Create initial reward logs
    await Reward.create({
      user: citizen._id,
      pointsEarned: 150,
      activityType: 'pickup_complete',
      referenceId: pickup3._id
    });

    // 4. Create standard alerts
    await Notification.create({
      recipient: citizen._id,
      title: 'Welcome to EcoSync! 🎉',
      message: 'Create waste schedules, upload garbage images, and track green reward rankings.',
      type: 'system_alert'
    });

    await Notification.create({
      recipient: citizen._id,
      title: 'Collect Coins!',
      message: 'Your Hauz Khas collection has been completed. 160 recycling coins added!',
      type: 'points_earned'
    });

    console.log('[SEEDER] Gamified system seed completes successfully! Ready.');

  } catch (error) {
    console.error(`[SEEDER ERROR] Seeding database failed: ${error.message}`);
  }
};

module.exports = seedSystemData;
