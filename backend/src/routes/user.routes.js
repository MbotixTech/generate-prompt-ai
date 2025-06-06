const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getMe, getHistory } = require('../controllers/user.controller');

const router = express.Router();

// Protected routes
router.use(authenticate);

// Get current user info
router.get('/me', getMe);

// Get user prompt history
router.get('/history', getHistory);

module.exports = router;
