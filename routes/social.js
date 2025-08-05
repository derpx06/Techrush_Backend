// routes/social.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const socialController = require('../controllers/socialController');
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `social-post-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage: storage });

router.post(
    '/share',
    auth,
    upload.single('image'),
    socialController.shareActivity
);

router.get('/community', auth, socialController.getCommunityActivity);

module.exports = router;
