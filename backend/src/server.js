require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const promptRoutes = require('./routes/prompt.routes');
const adminRoutes = require('./routes/admin.routes');
const contactRoutes = require('./routes/contact.routes');

// Import models
const User = require('./models/user.model');

// Import middleware and utilities
const { errorHandler } = require('./middleware/errorHandler');
const corsErrorHandler = require('./middleware/corsErrorHandler');
const { resetDailyQuota } = require('./utils/quotaReset');
const { initDatabase } = require('./utils/dbInit');
const notifications = require('./utils/notifications');

// Initialize express app
const app = express();

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['https://generateprompt.mbotix.tech'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Apply security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' })); // Limit request size

// MongoDB connection
try {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      
      // Initialize database with required data
      await initDatabase();
      
      // Initialize notification system
      notifications.initialize();
      
      // Log success
      console.log('Database and notifications initialized successfully');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
} catch (error) {
  console.error('Error connecting to MongoDB:', error);
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/prompt', promptRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is up and running' });
});

// Error handling middleware
app.use(corsErrorHandler);  // Handle CORS errors first
app.use(errorHandler);      // Then handle other errors

// Import subscription manager
const { downgradeExpiredSubscriptions, checkSoonToExpireSubscriptions } = require('./utils/subscriptionManager');

// Schedule quota reset and subscription checks at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`Running scheduled tasks at ${timestamp}`);
    
    // Reset daily quota for free users
    await resetDailyQuota();
    console.log('Daily quota has been reset successfully');
    
    // Check and downgrade expired pro subscriptions
    const result = await downgradeExpiredSubscriptions();
    if (result.modifiedCount > 0) {
      console.log(`Downgraded ${result.modifiedCount} users with expired pro subscriptions to free tier`);
    }
    
    // Check for subscriptions expiring soon (in the next 3 days)
    await checkSoonToExpireSubscriptions(3);
    
    console.log(`Scheduled tasks completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error in scheduled tasks:', error);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
