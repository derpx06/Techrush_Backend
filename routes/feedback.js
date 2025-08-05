// routes/feedback.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

router.post('/submit', auth, feedbackController.submitFeedback);
router.get('/', auth, feedbackController.getFeedback);

module.exports = router;