const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const clubController = require('../controllers/clubController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `club-cover-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage: storage });

router.post(
  '/',
  auth,
  role(['Admin']),
  upload.single('coverImage'),
  clubController.createClub
);


router.get('/', clubController.getAllClubs);

router.get('/:clubId', clubController.getClubDetails);

router.post('/:clubId/join', auth, clubController.joinClub);

module.exports = router;
