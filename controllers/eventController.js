const mongoose = require('mongoose');
const Event = require('../models/Event');
const Club = require('../models/Club');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const fs = require('fs').promises;
const logger = require('../utils/logger');

exports.createEvent = async (req, res, next) => {
  try {
    const { clubId, title, description, date, location, eventType, ticketPrice, capacity, visibility } = req.body;

    if (clubId) {
      const club = await Club.findById(clubId);
      if (!club) {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(404).json({ message: 'Club not found.' });
      }
      if (!club.organizers.includes(req.user._id)) {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(403).json({ message: 'Forbidden. Only organizers of this club can create events.' });
      }
    }

    if (eventType === 'Paid' && (!ticketPrice || ticketPrice <= 0)) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'Paid events must have a ticket price greater than zero.' });
    }

    const coverImage = req.file ? `/uploads/${req.file.filename}` : '';

    const eventData = {
      title,
      description,
      creator: req.user._id,
      date,
      location,
      eventType,
      ticketPrice: eventType === 'Paid' ? ticketPrice : 0,
      capacity,
      visibility,
      coverImage,
    };

    if (clubId) eventData.club = clubId;

    const event = new Event(eventData);
    await event.save();

    logger.info(`New event "${title}" created${clubId ? ` for club "${clubId}"` : ''}`);
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => console.error("Error deleting file on failure:", err));
    }
    next(error);
  }
};

exports.getAllPublicEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ visibility: 'Public' })
      .populate('club', 'name')
      .sort({ date: 1 })
      .lean();

    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};
exports.getEventDetails = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('club', 'name coverImage')
      .populate('creator', 'name profilePicture')
      .populate('attendees', 'name profilePicture');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

exports.registerForEvent = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const event = await Event.findById(req.params.eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Event not found.' });
    }

    const userId = req.user._id;
    if (event.attendees.includes(userId)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }

    if (event.capacity && event.attendees.length >= event.capacity) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Sorry, this event is full.' });
    }

    if (event.eventType === 'Paid') {
      const user = await User.findById(userId).session(session);
      const creator = await User.findById(event.creator).session(session);

      if (user.balance < event.ticketPrice) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Insufficient balance.' });
      }

      user.balance -= event.ticketPrice;
      creator.balance += event.ticketPrice;

      await user.save({ session });
      await creator.save({ session });

      const newTransaction = new Transaction({
        sender: userId,
        receiver: event.creator,
        amount: event.ticketPrice,
        description: `Ticket for event: ${event.title}`,
        status: 'Completed'
      });
      await newTransaction.save({ session });
    }

    event.attendees.push(userId);
    await event.save({ session });

    await new Notification({
      user: userId,
      message: `You have successfully registered for the event: "${event.title}".`,
      type: 'Event',
      relatedId: event._id
    }).save({ session });

    await session.commitTransaction();
    logger.info(`${req.user.name} registered for event "${event.title}"`);
    res.status(200).json({ message: 'Successfully registered for the event!', event });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
