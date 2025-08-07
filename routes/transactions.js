const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');
const multer = require('multer')
const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post('/send',upload.none(), auth, transactionController.sendPayment);
router.post('/request',upload.none(), auth, transactionController.requestPayment);
router.get('/history',auth, transactionController.getTransactionHistory);


module.exports = router;