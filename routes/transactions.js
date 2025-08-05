const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

router.post('/send', auth, transactionController.sendPayment);
router.post('/request', auth, transactionController.requestPayment);
router.get('/history', auth, transactionController.getTransactionHistory);


module.exports = router;