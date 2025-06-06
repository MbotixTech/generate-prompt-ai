/**
 * Contact form routes
 */
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { body } = require('express-validator');
const { errorHandler } = require('../middleware/errorHandler');

/**
 * @route POST /api/contact
 * @desc Send a contact form message
 * @access Public
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
  ],
  contactController.sendContactMessage
);

// Apply error handler middleware
router.use(errorHandler);

module.exports = router;
