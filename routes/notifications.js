const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.post('/', auth, notificationController.createNotification);
router.get('/', auth, notificationController.getNotifications);

module.exports = router;