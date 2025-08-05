// models/Bill.js
const mongoose = require('mongoose');

const billSplitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  _id: false
});

const billSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  splits: [billSplitSchema],
  type: {
    type: String,
    default: 'Bill',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Bill', billSchema);
