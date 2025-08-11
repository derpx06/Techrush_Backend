const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['Student', 'Club Organizer', 'Admin'],
    default: 'Student',
  },
  description: {
    type: String,
    trim: true,
    required:false,
    default: '',
  },
  profilePicture: {
    type: String,
    required:false,
    default: '', 
  },
  balance: {
    type: Number,
    required: true,
    default: 25000,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
