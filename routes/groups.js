// routes/groups.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const groupController = require('../controllers/groupController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `group-message-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage: storage });

router.post('/', auth, groupController.createGroup);
router.get('/:id', auth, groupController.getGroupDetails);

router.get('/:groupId/activity', auth, groupController.getGroupActivity);

router.post(
    '/:groupId/messages',
    auth,
    upload.single('image'), 
    groupController.sendGroupMessage
);

router.post('/:groupId/split-bill', auth, groupController.splitBill);
router.post('/bills/:billId/settle', auth, groupController.settlePayment);

module.exports = router;
