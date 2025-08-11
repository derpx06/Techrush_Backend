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
  eventType: {
    type: String,
    enum: ['Free', 'Paid'],
    default: 'Free',
    required: true,
  },
  ticketPrice: {
    type: Number,
    default: 0,
    min: 0,
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
