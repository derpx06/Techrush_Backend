const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Bill = require('../models/Bill');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

exports.createGroup = async (req, res, next) => {
  try {
    const { name, participants, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Group name is required.' });
    }
    const participantIds = (participants || []).map(id => new mongoose.Types.ObjectId(id));
    const creatorId = req.user._id;
    if (!participantIds.some(id => id.equals(creatorId))) {
      participantIds.push(creatorId);
    }
    const validUsers = await User.find({ _id: { $in: participantIds } }).select('_id');
    if (validUsers.length !== participantIds.length) {
      return res.status(404).json({ message: 'One or more participant users could not be found.' });
    }
    const group = new Group({
      name,
      creator: creatorId,
      participants: participantIds.map(userId => ({ user: userId })),
      description,
    });
    await group.save();

    const notifications = participantIds
      .filter(id => !id.equals(creatorId))
      .map(userId => ({
        user: userId,
        message: `You've been added to a new group: "${name}" by ${req.user.name}.`,
        type: 'Group',
        relatedId: group._id,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    logger.info(`Group "${name}" created by ${req.user.email}`);
    res.status(201).json({ message: 'Group created successfully', group });
  } catch (error) {
    next(error);
  }
};

exports.getMyGroups = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ 'participants.user': userId })
      .populate('participants.user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json(groups);
  } catch (error) {
    next(error);
  }
};

exports.getGroupDetails = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id)
          .populate('creator participants.user', 'name email profilePicture');
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.json(group);
      } catch (error) {
        next(error);
      }
};

exports.getGroupActivity = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId).populate('participants.user', 'name profilePicture');
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        const isParticipant = group.participants.some(p => p.user.equals(req.user._id));
        if (!isParticipant) {
            return res.status(403).json({ message: 'Only group members can view activity.' });
        }
        
        const bills = await Bill.find({ group: groupId }).populate('creator splits.user', 'name profilePicture').lean();
        
        const processedBills = bills.map(bill => {
            const paidCount = bill.splits.filter(s => s.paid).length;
            const totalCount = bill.splits.length;
            return {
                ...bill,
                paymentStatus: `${paidCount}/${totalCount} Paid`
            };
        });

        res.status(200).json({ group, bills: processedBills });
    } catch (error) {
        next(error);
    }
};

exports.splitBill = async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: 'Request body is missing or empty.',
      error: 'Ensure the client is sending a JSON body with Content-Type: application/json.'
    });
  }
  const { groupId } = req.params;
  const { totalAmount, description, splits } = req.body;
  if (!totalAmount || totalAmount <= 0 || !description) {
    return res.status(400).json({ message: 'Description and a positive total amount are required.' });
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const group = await Group.findById(groupId).session(session);
    if (!group) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Group not found' });
    }
    const billSplits = [];
    if (splits && splits.length > 0) {
      const customSplitTotal = splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(customSplitTotal - totalAmount) > 0.01) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'The sum of custom splits must equal the total amount.' });
      }
      splits.forEach(split => {
        billSplits.push({ user: split.user, amount: split.amount });
      });
    } else {
      const participantCount = group.participants.length;
      if (participantCount === 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'No participants to split the bill with.' });
      }
      const amountPerPerson = totalAmount / participantCount;
      group.participants.forEach(p => {
        billSplits.push({ user: p.user, amount: amountPerPerson });
      });
    }
    const bill = new Bill({
      group: groupId,
      creator: req.user._id,
      description,
      totalAmount,
      splits: billSplits,
    });
    await bill.save({ session });
    const notifications = bill.splits
        .filter(s => !s.user.equals(req.user._id))
        .map(split => ({
            user: split.user,
            message: `${req.user.name} added a new bill "${description}" for ₹${split.amount.toFixed(2)} in group "${group.name}".`,
            type: 'PaymentRequest',
            relatedId: bill._id,
    }));
    if(notifications.length > 0) {
        await Notification.insertMany(notifications, { session });
    }
    await session.commitTransaction();
    logger.info(`New bill "${description}" created in group "${group.name}"`);
    res.status(201).json({ message: 'Bill created and split successfully', bill });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.settlePayment = async (req, res, next) => {
    const { billId } = req.params;
    const userId = req.user._id;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const bill = await Bill.findById(billId)
            .populate('group', 'name')
            .session(session);

        if (!bill) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Bill not found' });
        }
        const split = bill.splits.find(s => s.user.equals(userId));
        if (!split) {
            await session.abortTransaction();
            return res.status(403).json({ message: 'You are not part of this bill split.' });
        }
        if (split.paid) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'You have already settled this payment.' });
        }

        const payer = await User.findById(userId).session(session);
        const receiver = await User.findById(bill.creator).session(session);

        if (payer.balance < split.amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Insufficient balance.' });
        }

        payer.balance -= split.amount;
        receiver.balance += split.amount;

        await payer.save({ session });
        await receiver.save({ session });

        const newTransaction = new Transaction({
            sender: userId,
            receiver: bill.creator,
            amount: split.amount,
            description: `Settled bill: "${bill.description}" in group "${bill.group.name}"`,
            status: 'Completed'
        });
        await newTransaction.save({ session });
        split.paid = true;
        await bill.save({ session });
        if (!bill.creator.equals(userId)) {
            const notification = new Notification({
                user: bill.creator,
                message: `${req.user.name} paid their share of ₹${split.amount.toFixed(2)} for "${bill.description}".`,
                type: 'PaymentSettled',
                relatedId: bill._id,
            });
            await notification.save({ session });
        }
        await session.commitTransaction();
        logger.info(`${req.user.name} settled payment for bill "${bill.description}"`);
        res.json({ message: 'Your payment has been successfully settled.', bill });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};
