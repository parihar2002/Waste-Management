const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const dns = require('dns');

// Configure custom DNS servers to resolve MongoDB Atlas SRV records successfully
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsError) {
  console.warn('[DNS WARNING] Could not set custom DNS servers:', dnsError.message);
}

// Load environment variables
dotenv.config();

// Initialize Express App and HTTP Server
const app = express();
const server = http.createServer(app);

// Setup CORS options with local development and production URLs
const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null;
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  frontendUrl
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
};

// Integrate Socket.io with customizable CORS
const io = socketIo(server, {
  cors: corsOptions
});

// Store Socket.io reference globally in Express app to query in controllers
app.set('socketio', io);

// Security and utility middleware
app.use(helmet({
  contentSecurityPolicy: false // Allows loading external Leaflet map tiles
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting for public endpoints (prevents dictionary/brute-force attacks)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/waste-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`[DATABASE] MongoDB Connected successfully to: ${conn.connection.host}`);
    
    // Launch automated database seeding
    const seedSystemData = require('./utils/seed');
    await seedSystemData();
  } catch (error) {
    console.error(`[DATABASE ERROR] ${error.message}`);
    // Do not crash the process in mock environments, print warning
    console.warn('[DATABASE WARNING] Database connection failed. Working in local dev environment with mock features.');
  }
};
connectDB();

// Mount API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pickups', require('./routes/pickupRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/rewards', require('./routes/rewardRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EcoSync Smart Waste API is fully functional',
    timestamp: new Date()
  });
});

// Real-Time Socket Connection Handlers
io.on('connection', (socket) => {
  console.log(`[SOCKET] New socket client connected: ${socket.id}`);

  // Room Join handles: User Specific alerts
  socket.on('join:user', (userId) => {
    socket.join(`users:${userId}`);
    console.log(`[SOCKET] Socket client ${socket.id} joined personal channel: users:${userId}`);
  });

  // Room Join handles: Admins Specific updates
  socket.on('join:admins', () => {
    socket.join('admins');
    console.log(`[SOCKET] Socket client ${socket.id} joined admin monitor: admins`);
  });

  // Room Join handles: Live Geo-Tracking room
  socket.on('join:track', (pickupId) => {
    socket.join(`track:${pickupId}`);
    console.log(`[SOCKET] Socket client ${socket.id} joined tracking channel: track:${pickupId}`);
  });

  // Real-Time geolocation streaming from driver GPS simulation
  socket.on('driver:location:update', (data) => {
    const { pickupId, latitude, longitude, driverName, heading } = data;
    console.log(`[TELEMETRY] Live truck coordinate update received for pickup ${pickupId}: Lat ${latitude}, Lon ${longitude}`);
    
    // Broadcast live geo coordinates to citizens and admins in the tracking channel
    io.to(`track:${pickupId}`).emit('location:stream', {
      pickupId,
      latitude,
      longitude,
      driverName,
      heading,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Socket client disconnected: ${socket.id}`);
  });
});

// Serve frontend static assets in production mode
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // For any client-side routes, fallback to index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

// Centralized error handler
const errorHandler = require('./middleware/errorMiddleware');
app.use(errorHandler);

// Define PORT and start listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[SERVER] EcoSync Server running in production-ready mode on port ${PORT}`);
});
