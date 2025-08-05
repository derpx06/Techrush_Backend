// models/Club.js
const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Club name is required.'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Club description is required.'],
    trim: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    _id: false,
  }],
  pendingRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  membershipType: {
    type: String,
    enum: ['Free', 'Subscription'],
    default: 'Free',
  },
  subscriptionFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  subscriptionFrequency: {
    type: String,
    enum: [null, 'Monthly', 'Quarterly', 'Annually'],
    default: null,
  },
  coverImage: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

clubSchema.pre('save', function(next) {
  if (this.isNew && !this.organizers.includes(this.creator)) {
    this.organizers.push(this.creator);
  }
  next();
});

module.exports = mongoose.model('Club', clubSchema);
