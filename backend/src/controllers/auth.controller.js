const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const verificationCode = require('../utils/verificationCode');

// Register new user - Step 1: Create unverified user and send verification code
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists (case-insensitive for username)
    let user = await User.findOne({ 
      $or: [
        { email }, 
        { username: { $regex: new RegExp(`^${username}$`, 'i') } } // Case insensitive username check
      ] 
    });
    if (user) {
      return res.status(400).json({
        message: user.email === email 
          ? 'Email sudah terdaftar.' 
          : 'Username sudah digunakan.'
      });
    }

    // Create new user (initially unverified)
    // Store username in lowercase for consistent handling
    user = new User({
      username: username.toLowerCase(),
      email,
      password,
      emailVerified: false
    });

    await user.save();
    
    // Send verification code
    const verificationResult = await verificationCode.sendVerificationCode(
      user._id.toString(),
      user.email,
      'email-verify',
      user.username
    );
    
    if (!verificationResult.success) {
      // If email sending fails, still create the user but notify about the issue
      console.error('Failed to send verification email:', verificationResult.error);
    }

    // Generate JWT token (limited permissions until email is verified)
    const token = jwt.sign(
      { 
        userId: user._id,
        verified: false
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Shorter expiration for unverified users
    );

    res.status(201).json({
      message: 'Pendaftaran berhasil. Silakan verifikasi email Anda.',
      verificationSent: verificationResult.success,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: false
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Kesalahan server saat pendaftaran.' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Login attempt with:', req.body);
    
    // Extract credentials - support both username or email field
    let username = req.body.username || req.body.email;
    const { password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username/email dan password wajib diisi.' });
    }
    
    // Convert username to lowercase for consistent handling if it's not an email
    if (!username.includes('@')) {
      username = username.toLowerCase();
    }

    // Check if user exists by username or email (case insensitive for username)
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } }, // Case insensitive username matching
        { email: username } // Allow login with email in username field
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Username atau password tidak valid.' });
    }

    // Check password
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username atau password tidak valid.' });
    }
    
    // Check if email is verified (skip for admin accounts)
    if (user.role !== 'admin' && !user.emailVerified) {
      // Send new verification code if needed
      const verificationResult = await verificationCode.sendVerificationCode(
        user._id.toString(),
        user.email,
        'email-verify',
        user.username
      );
      
      // Return limited token and notify user about verification
      const limitedToken = jwt.sign(
        { userId: user._id, verified: false },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.status(200).json({
        message: 'Email belum diverifikasi. Kode verifikasi baru telah dikirim ke email Anda.',
        verificationNeeded: true,
        verificationSent: verificationResult.success,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          verified: false
        },
        token: limitedToken
      });
    }

    // Generate JWT token (full access)
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login berhasil.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.emailVerified
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Kesalahan server saat login.' });
  }
};

// Request password reset by email (Step 1: Send verification code)
exports.requestPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, still return success even if email not found
      // But include a hidden property that the frontend can check
      return res.status(200).json({
        message: 'Jika email terdaftar, kode verifikasi akan dikirim ke email Anda.',
        emailExists: false // Hidden flag that the frontend can check
      });
    }
    
    // Send verification code
    const result = await verificationCode.sendVerificationCode(
      user._id.toString(),
      user.email,
      'password-reset',
      user.username
    );
    
    if (!result.success) {
      console.error('Error sending verification code:', result.error);
      return res.status(500).json({
        message: 'Gagal mengirim kode verifikasi. Silakan coba lagi nanti.'
      });
    }
    
    res.status(200).json({
      message: 'Kode verifikasi telah dikirim ke email Anda.',
      userId: user._id,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      message: 'Kesalahan server saat memproses permintaan reset password.' 
    });
  }
};

// Verify code and reset password (Step 2)
exports.verifyAndResetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, verificationCode: code, newPassword } = req.body;
    
    // Verify the code
    const verification = verificationCode.verifyCode(
      userId,
      code,
      'password-reset'
    );
    
    if (!verification.valid) {
      return res.status(400).json({
        message: 'Kode verifikasi tidak valid atau sudah kadaluwarsa.',
        reason: verification.reason
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Pengguna tidak ditemukan.'
      });
    }
    
    // Make sure the verified email matches the user's email
    if (verification.email !== user.email) {
      return res.status(400).json({
        message: 'Verifikasi gagal. Data pengguna tidak sesuai.'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      message: 'Password berhasil direset.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: 'Kesalahan server saat reset password.' 
    });
  }
};

// Legacy password reset (to be deprecated)
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, newPassword } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      message: 'Password berhasil direset.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Kesalahan server saat reset password.' });
  }
};

// Admin reset password for a user
exports.adminResetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    
    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    // Don't allow resetting admin passwords
    if (user.role === 'admin' && req.user.role === 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ message: 'Tidak dapat reset password admin lain.' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      message: 'Password pengguna berhasil direset.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({ message: 'Kesalahan server saat reset password.' });
  }
};

// Verify email with code
exports.verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, verificationCode: code } = req.body;
    
    // Verify the code
    const verification = verificationCode.verifyCode(
      userId,
      code,
      'email-verify'
    );
    
    if (!verification.valid) {
      return res.status(400).json({
        message: 'Kode verifikasi tidak valid atau sudah kadaluwarsa.',
        reason: verification.reason
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Pengguna tidak ditemukan.'
      });
    }
    
    // Make sure the verified email matches the user's email
    if (verification.email !== user.email) {
      return res.status(400).json({
        message: 'Verifikasi gagal. Data pengguna tidak sesuai.'
      });
    }
    
    // Update user to verified
    user.emailVerified = true;
    await user.save();
    
    // Generate new token with full permissions
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      message: 'Email berhasil diverifikasi.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: true
      },
      token
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      message: 'Kesalahan server saat verifikasi email.'
    });
  }
};

// Resend verification code
exports.resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Pengguna tidak ditemukan.'
      });
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        message: 'Email sudah diverifikasi sebelumnya.'
      });
    }
    
    // Invalidate any existing codes
    verificationCode.invalidateCode(userId, 'email-verify');
    
    // Send new verification code
    const result = await verificationCode.sendVerificationCode(
      user._id.toString(),
      user.email,
      'email-verify',
      user.username
    );
    
    if (!result.success) {
      return res.status(500).json({
        message: 'Gagal mengirim kode verifikasi. Silakan coba lagi nanti.',
        error: result.error
      });
    }
    
    res.status(200).json({
      message: 'Kode verifikasi baru telah dikirim ke email Anda.',
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({
      message: 'Kesalahan server saat mengirim ulang kode verifikasi.'
    });
  }
};
