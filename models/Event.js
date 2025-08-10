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
    default: new mongoose.Types.ObjectId('689812dd4b55074b356bd2d1')
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
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

eventSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (!ret.club) delete ret.club;
    return ret;
  }
});

eventSchema.set('toObject', {
  transform: (doc, ret) => {
    if (!ret.club) delete ret.club;
    return ret;
  }
});

module.exports = mongoose.model('Event', eventSchema);