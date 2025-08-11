const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userContentController = require('../controllers/userContentController');

router.get('/me/content', auth, userContentController.getMyContent);

module.exports = router;
