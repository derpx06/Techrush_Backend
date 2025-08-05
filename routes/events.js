const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const eventController = require('../controllers/eventController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `event-cover-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage: storage });

router.post(
    '/',
    auth,
    upload.single('coverImage'), 
    eventController.createEvent
);

router.get('/', auth,eventController.getAllPublicEvents);

router.get('/:eventId', auth, eventController.getEventDetails); 

router.post('/:eventId/register', auth, eventController.registerForEvent);

module.exports = router;
