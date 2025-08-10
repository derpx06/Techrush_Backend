const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const groupController = require('../controllers/groupController');

router.get('/my-groups', auth, groupController.getMyGroups);
router.post('/', auth, groupController.createGroup);
router.get('/:id', auth, groupController.getGroupDetails);
router.get('/:groupId/activity', auth, groupController.getGroupActivity);
router.post('/:groupId/split-bill', auth, groupController.splitBill);
router.post('/bills/:billId/settle', auth, groupController.settlePayment);

module.exports = router;
