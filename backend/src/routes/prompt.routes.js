const express = require('express');
const { authenticate, checkQuota } = require('../middleware/auth');
const { createVeoPrompt, createImagePrompt, getPromptHistory } = require('../controllers/prompt.controller');

const router = express.Router();

// Protected routes
router.use(authenticate);

// Create Video prompt
router.post('/veo', checkQuota, createVeoPrompt);

// Create Image prompt
router.post('/image', checkQuota, createImagePrompt);

// Get prompt history
router.get('/history', getPromptHistory);

module.exports = router;
