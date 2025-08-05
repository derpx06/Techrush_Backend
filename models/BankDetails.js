const mongoose = require('mongoose');

  const bankDetailsSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
      required: [true, 'Phone number is required for bank details'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  module.exports = mongoose.model('BankDetails', bankDetailsSchema);