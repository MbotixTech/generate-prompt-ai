const express = require('express');
const { check } = require('express-validator');
const { authenticate, isAdmin } = require('../middleware/auth');
const { 
  getAllUsers, 
  updateUserRole, 
  deleteUser,
  addUserDuration,
  createUser,
  setUnlimited,
  checkSubscriptions,
  testNotification
} = require('../controllers/admin.controller');

const { adminResetPassword } = require('../controllers/auth.controller');

const router = express.Router();

// Protected admin routes
router.use(authenticate, isAdmin);

// Get all users
router.get('/users', getAllUsers);

// Create new user
router.post(
  '/users',
  [
    check('username', 'Username wajib diisi').not().isEmpty(),
    check('username', 'Username minimal 3 karakter').isLength({ min: 3 }),
    check('email', 'Masukkan email yang valid').isEmail(),
    check('password', 'Password minimal 6 karakter').isLength({ min: 6 }),
    check('role', 'Role tidak valid').optional().isIn(['free', 'pro'])
  ],
  createUser
);

// Update user role
router.patch(
  '/user/:id/role',
  [
    check('role', 'Role wajib diisi').not().isEmpty(),
    check('role', 'Role tidak valid').isIn(['free', 'pro'])
  ],
  updateUserRole
);

// Add duration to user's pro subscription
router.post(
  '/user/:id/duration',
  [
    check('durationDays', 'Durasi wajib diisi').isNumeric(),
    check('durationType', 'Tipe durasi tidak valid').optional().isIn(['daily', 'monthly', 'yearly'])
  ],
  addUserDuration
);

// Set unlimited subscription
router.post('/user/:id/unlimited', setUnlimited);

// Reset user password
router.post(
  '/user/:id/reset-password',
  [
    check('newPassword', 'Password baru minimal 6 karakter').isLength({ min: 6 })
  ],
  adminResetPassword
);

// Delete user
router.delete('/user/:id', deleteUser);

// Check and update subscription statuses manually (admin tool)
router.post('/check-subscriptions', checkSubscriptions);

// Test notification system
router.post('/test-notification', testNotification);

module.exports = router;
