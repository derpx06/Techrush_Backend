// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required.'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Event description is required.'],
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required:[true,'Event Location is needed'],
  },
  coverImage: {
    type: String,
    default: '',
  },
  eventType: {
    type: String,
    enum: ['Free', 'Paid'],
    default: 'Free',
  },
  ticketPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  capacity: {
    type: Number,
    min: 1,
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  visibility: {
    type: String,
    enum: ['Public', 'ClubOnly'],
    default: 'Public',
  },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
