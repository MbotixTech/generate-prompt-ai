const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const notifications = require('../utils/notifications');
const { downgradeExpiredSubscriptions, checkSoonToExpireSubscriptions } = require('../utils/subscriptionManager');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const options = {
      select: '-password',
      sort: { createdAt: -1 },
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    };
    
    const users = await User.find(query, null, options);
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Kesalahan server saat mengambil data pengguna.' });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['free', 'pro'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid.' });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    // Don't allow changing admin roles
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Tidak dapat mengubah role admin.' });
    }
    
    user.role = role;
    await user.save();
    
    // Send email notification if role was upgraded to Pro
    if (role === 'pro') {
      try {
        // Initialize notifications
        notifications.initialize();
        
        // Send email notification to user
        const emailResult = await notifications.subscriptions.notifyUserUpgradedToPro(user);
        console.log(`Email notification for role upgrade sent to ${user.email}: ${emailResult.success ? 'Success' : 'Failed'}`);
      } catch (emailError) {
        console.error(`Error sending role upgrade email to ${user.email}:`, emailError);
        // Don't fail the request if email fails, just log the error
      }
    }
    
    res.status(200).json({
      message: `Role pengguna berhasil diubah menjadi ${role}.`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Kesalahan server saat mengubah role pengguna.' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Tidak dapat menghapus pengguna admin.' });
    }
    
    await User.findByIdAndDelete(id);
    
    res.status(200).json({
      message: 'Pengguna berhasil dihapus.'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Kesalahan server saat menghapus pengguna.' });
  }
};

// Add duration to user's pro subscription
exports.addUserDuration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { durationDays, durationType } = req.body;
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    // Calculate new expiration date
    let days;
    
    switch (durationType) {
      case 'daily':
        days = parseInt(durationDays);
        break;
      case 'monthly':
        days = parseInt(durationDays) * 30;
        break;
      case 'yearly':
        days = parseInt(durationDays) * 365;
        break;
      default:
        days = parseInt(durationDays);
    }
    
    // Validate duration
    if (!days || days <= 0) {
      return res.status(400).json({ message: 'Durasi harus lebih dari 0 hari.' });
    }
    
    let newExpiration;
    const currentDate = new Date();
    
    if (user.subscriptionExpires && user.subscriptionExpires > currentDate) {
      // If subscription is active, extend it
      newExpiration = new Date(user.subscriptionExpires);
      newExpiration.setDate(newExpiration.getDate() + days);
    } else {
      // If no active subscription, start from now
      newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + days);
    }
    
    // Update user
    user.role = 'pro';
    user.subscriptionExpires = newExpiration;
    await user.save();
    
    // Send email notification about subscription extension
    try {
      // Initialize notifications
      notifications.initialize();
      
      // Send email notification to user
      const emailResult = await notifications.subscriptions.notifyUserSubscriptionExtended(user, days, newExpiration);
      console.log(`Email notification for subscription extension sent to ${user.email}: ${emailResult.success ? 'Success' : 'Failed'}`);
    } catch (emailError) {
      console.error(`Error sending subscription extension email to ${user.email}:`, emailError);
      // Don't fail the request if email fails, just log the error
    }
    
    res.status(200).json({
      message: `Berhasil menambahkan ${days} hari ke langganan Pro.`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscriptionExpires: user.subscriptionExpires
      }
    });
  } catch (error) {
    console.error('Add user duration error:', error);
    res.status(500).json({ message: 'Kesalahan server saat menambah durasi langganan.' });
  }
};

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    // Check if user already exists
    let userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        message: userExists.email === email 
          ? 'Email sudah terdaftar.' 
          : 'Username sudah digunakan.'
      });
    }

    // Validate role
    if (role && !['free', 'pro'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid.' });
    }

    // Create subscription expiration date if pro
    let subscriptionExpires = null;
    if (role === 'pro') {
      subscriptionExpires = new Date();
      subscriptionExpires.setDate(subscriptionExpires.getDate() + 30); // Default 30 days
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role: role || 'free',
      subscriptionExpires
    });

    await newUser.save();

    res.status(201).json({
      message: 'Pengguna berhasil dibuat.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        subscriptionExpires: newUser.subscriptionExpires
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Kesalahan server saat membuat pengguna.' });
  }
};

// Set unlimited subscription
exports.setUnlimited = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    // Set to unlimited by setting expiry far in the future
    const unlimitedDate = new Date();
    unlimitedDate.setFullYear(unlimitedDate.getFullYear() + 100); // 100 years in the future
    
    // Update user
    user.role = 'pro';
    user.subscriptionExpires = unlimitedDate;
    await user.save();
    
    // Send email notification about unlimited subscription
    try {
      // Initialize notifications
      notifications.initialize();
      
      // Send email notification to user
      // We'll reuse the subscription extended template but customize the message
      const emailResult = await notifications.subscriptions.notifyUserSubscriptionExtended(
        user, 
        "unlimited", // Special value to indicate unlimited
        unlimitedDate
      );
      console.log(`Email notification for unlimited subscription sent to ${user.email}: ${emailResult.success ? 'Success' : 'Failed'}`);
    } catch (emailError) {
      console.error(`Error sending unlimited subscription email to ${user.email}:`, emailError);
      // Don't fail the request if email fails, just log the error
    }
    
    res.status(200).json({
      message: 'Berhasil mengatur langganan Pro menjadi tidak terbatas.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscriptionExpires: user.subscriptionExpires
      }
    });
  } catch (error) {
    console.error('Set unlimited error:', error);
    res.status(500).json({ message: 'Kesalahan server saat mengatur langganan tidak terbatas.' });
  }
};

// Manual check and update of subscription statuses (admin tool)
exports.checkSubscriptions = async (req, res) => {
  try {
    // Process query parameters
    const checkOnly = req.query.checkOnly === 'true';
    const notifyDays = parseInt(req.query.notifyDays) || 3;
    
    // Get stats before changes
    const beforeStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Check for soon-to-expire subscriptions
    const soonToExpire = await checkSoonToExpireSubscriptions(notifyDays);
    
    let downgradeResult = { modifiedCount: 0 };
    if (!checkOnly) {
      // Downgrade expired subscriptions
      downgradeResult = await downgradeExpiredSubscriptions();
    }
    
    // Get stats after changes
    const afterStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format the before/after stats for response
    const formatStats = (stats) => {
      const result = { total: 0 };
      stats.forEach(item => {
        result[item._id] = item.count;
        result.total += item.count;
      });
      return result;
    };
    
    res.status(200).json({
      message: checkOnly ? 
        'Pemeriksaan langganan selesai tanpa perubahan (mode check-only)' : 
        `Pemeriksaan dan pembaruan langganan selesai. ${downgradeResult.modifiedCount} pengguna diubah dari pro ke free.`,
      checkOnly,
      stats: {
        before: formatStats(beforeStats),
        after: formatStats(afterStats),
        downgraded: downgradeResult.modifiedCount
      },
      soonToExpire: soonToExpire.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        expiresAt: user.subscriptionExpires,
        daysLeft: Math.ceil((user.subscriptionExpires - new Date()) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (error) {
    console.error('Check subscriptions error:', error);
    res.status(500).json({ message: 'Kesalahan server saat memeriksa status langganan.' });
  }
};

// Test notification function
exports.testNotification = async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    // Validate input
    if (!userId || !message) {
      return res.status(400).json({ message: 'userId dan message harus diisi.' });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    // Send notification
    await notifications.sendNotification(userId, message);
    
    res.status(200).json({ message: 'Notifikasi berhasil dikirim.' });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ message: 'Kesalahan server saat mengirim notifikasi.' });
  }
};

// Test notifications system
exports.testNotification = async (req, res) => {
  try {
    const { type = 'info', message = 'Test notification from admin panel' } = req.body;
    
    // Basic validation
    if (!['info', 'warning', 'error'].includes(type)) {
      return res.status(400).json({ message: 'Notification type must be one of: info, warning, error' });
    }
    
    // Make sure notifications are initialized
    notifications.initialize();
    
    // Send a test notification
    const result = await notifications.sendNotification(
      message,
      type,
      { 
        source: 'Admin Panel',
        timestamp: new Date().toISOString(),
        admin: req.user.username,
        test: true
      }
    );
    
    if (result.success) {
      res.status(200).json({ 
        message: 'Notification sent successfully', 
        details: result 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to send notification', 
        error: result.reason || 'Unknown error' 
      });
    }
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ 
      message: 'Server error when sending test notification', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
