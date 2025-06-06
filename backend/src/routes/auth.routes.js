const express = require('express');
const { check } = require('express-validator');
const { 
  register, 
  login, 
  resetPassword, 
  verifyEmail, 
  resendVerificationCode,
  requestPasswordReset,
  verifyAndResetPassword,
  adminResetPassword
} = require('../controllers/auth.controller');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Register route
router.post(
  '/register',
  [
    check('username', 'Username wajib diisi').not().isEmpty(),
    check('username', 'Username minimal 3 karakter').isLength({ min: 3 }),
    check('email', 'Masukkan email yang valid').isEmail(),
    check('password', 'Password minimal 6 karakter').isLength({ min: 6 })
  ],
  register
);

// Login route
router.post(
  '/login',
  [
    check('password', 'Password wajib diisi').exists()
    // Username/email validation is handled in controller
  ],
  login
);

// Legacy password reset route (to be deprecated)
router.post(
  '/reset-password',
  [
    check('username', 'Username wajib diisi').not().isEmpty(),
    check('newPassword', 'Password baru minimal 6 karakter').isLength({ min: 6 })
  ],
  resetPassword
);

// Email verification route
router.post(
  '/verify-email',
  [
    check('userId', 'User ID tidak valid').isMongoId(),
    check('verificationCode', 'Kode verifikasi wajib diisi').not().isEmpty()
  ],
  verifyEmail
);

// Resend verification code
router.post(
  '/resend-verification',
  [
    check('userId', 'User ID tidak valid').isMongoId()
  ],
  resendVerificationCode
);

// Request password reset (step 1 - send code)
router.post(
  '/request-password-reset',
  [
    check('email', 'Email tidak valid').isEmail()
  ],
  requestPasswordReset
);

// Verify code and reset password (step 2)
router.post(
  '/verify-reset-password',
  [
    check('userId', 'User ID tidak valid').isMongoId(),
    check('verificationCode', 'Kode verifikasi wajib diisi').not().isEmpty(),
    check('newPassword', 'Password baru minimal 6 karakter').isLength({ min: 6 })
  ],
  verifyAndResetPassword
);

// Admin reset password route (protected)
router.post(
  '/admin-reset-password/:id',
  authenticate,
  isAdmin,
  [
    check('newPassword', 'Password baru minimal 6 karakter').isLength({ min: 6 })
  ],
  adminResetPassword
);

module.exports = router;
