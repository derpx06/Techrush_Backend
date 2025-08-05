// routes/auth.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

// --- Multer Configuration for File Uploads ---

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, `user-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); 
  } else {
    cb(new Error('Only image files are allowed!'), false); 
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post('/register', upload.single('profilePicture'), authController.register);
router.post('/login', upload.none(), authController.login);

router.get('/me', auth, authController.getProfile);
router.put('/profile', auth, upload.single('profilePicture'), authController.updateProfile);
router.get('/users/:id', auth, authController.getUserProfile);
router.post('/bank-details', auth, authController.addBankDetails);
router.get('/bank-details', auth, authController.getBankDetails);

module.exports = router;
