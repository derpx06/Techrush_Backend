const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.sendPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { receiverId, amount, description } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!receiverId || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Receiver ID and a positive amount are required.' });
    }

    const sender = await User.findById(req.user._id).session(session);
    const receiver = await User.findById(receiverId).session(session);

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found.' });
    }
    if (sender._id.toString() === receiverId) {
      return res.status(400).json({ message: 'Cannot send payment to yourself.' });
    }
    if (sender.balance < parsedAmount) {
        return res.status(400).json({ message: 'Insufficient balance.' });
    }

    sender.balance -= parsedAmount;
    receiver.balance += parsedAmount;

    await sender.save({ session });
    await receiver.save({ session });

    const transaction = new Transaction({
      sender: req.user._id,
      receiver: receiverId,
      amount: parsedAmount,
      description,
      status: 'Completed',
    });
    await transaction.save({ session });

    const receiverNotification = new Notification({
      user: receiverId,
      message: `You received a $${parsedAmount} payment from ${req.user.name} for ${description}`,
      type: 'Payment',
      relatedId: transaction._id,
    });
    await receiverNotification.save({ session });

    const senderNotification = new Notification({
      user: req.user._id,
      message: `You sent a $${parsedAmount} payment to ${receiver.name} for ${description}`,
      type: 'Payment',
      relatedId: transaction._id,
    });
    await senderNotification.save({ session });
    
    await session.commitTransaction();
    res.status(201).json({ message: 'Payment sent successfully', transaction });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.requestPayment = async (req, res, next) => {
  try {
    const { receiverId, amount, description } = req.body;
    if (!receiverId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Receiver ID and a positive amount are required.' });
    }
    const receiver = await User.findById(receiverId).select('name');
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found.' });
    }
    if (req.user._id.toString() === receiverId) {
      return res.status(400).json({ message: 'Cannot request payment from yourself.' });
    }
    const transaction = new Transaction({
      sender: req.user._id,
      receiver: receiverId,
      amount,
      description,
      status: 'Pending',
    });
    await transaction.save();
    res.status(201).json({ message: 'Payment request sent successfully', transaction });
  } catch (error) {
    next(error);
  }
};

exports.getTransactionHistory = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender receiver', 'name')
      .sort({ createdAt: -1 }); 

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found.' });
    }

    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};
