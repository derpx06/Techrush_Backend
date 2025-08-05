// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    // FIX: Added 'PaymentRequest' and 'PaymentSettled' to the list of allowed types.
    enum: [
        'Club',
        'Event',
        'Group',
        'Payment',
        'PaymentRequest', // For when a bill is created
        'PaymentSettled'  // For when a user pays their share
    ],
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
