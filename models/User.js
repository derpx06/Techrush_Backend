// models/User.js

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
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
