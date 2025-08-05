// models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  spent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Budget', budgetSchema);