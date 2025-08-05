// controllers/adminController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name email role');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const totalAmount = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({
      totalUsers,
      totalTransactions,
      totalAmount: totalAmount[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
};