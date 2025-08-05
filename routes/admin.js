// routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const adminController = require('../controllers/adminController');

router.get('/users', auth, roleMiddleware(['Admin']), adminController.getAllUsers);
router.delete('/users/:id', auth, roleMiddleware(['Admin']), adminController.deleteUser);
router.get('/analytics', auth, roleMiddleware(['Admin']), adminController.getAnalytics);

module.exports = router;