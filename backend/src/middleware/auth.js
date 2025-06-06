const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Akses ditolak. Token tidak ada.' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Akses ditolak. Pengguna tidak ditemukan.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token tidak valid.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Sesi habis. Silakan login kembali.' });
    }
    res.status(500).json({ message: 'Kesalahan server.' });
  }
};

// Admin authorization middleware
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }
  next();
};

// Quota check middleware
exports.checkQuota = async (req, res, next) => {
  try {
    const { user } = req;
    
    // Pro users have unlimited quota
    if (user.role === 'pro' || user.role === 'admin') {
      return next();
    }
    
    // Free users are limited to 2 prompts per day
    if (user.promptsToday >= 2) {
      return res.status(403).json({ 
        message: 'Kuota harian Anda sudah habis. Upgrade ke akun Pro untuk prompt tanpa batas.',
        quota: {
          used: user.promptsToday,
          limit: 2
        }
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Kesalahan server saat memeriksa kuota.' });
  }
};
