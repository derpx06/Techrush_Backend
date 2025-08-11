// models/Group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [
    {
     
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      _id: false 
    },
  ],
  description: {
      type: String,
      trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

groupSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Group', groupSchema);
