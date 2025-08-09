const Club = require('../models/Club');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const fs = require('fs').promises;

exports.createClub = async (req, res, next) => {
  try {
    const { name, description, eventType, ticketPrice } = req.body;

    if (!name || !description) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'Club name and description are required.' });
    }

    if (eventType === 'Paid' && (!ticketPrice || ticketPrice <= 0)) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'Paid clubs must have a ticket price greater than zero.' });
    }

    const clubExists = await Club.findOne({ name });
    if (clubExists) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(400).json({ message: `A club with the name "${name}" already exists.` });
    }

    const coverImage = req.file ? `/uploads/${req.file.filename}` : '';

    const club = new Club({
      name,
      description,
      creator: req.user._id,
      organizers: [req.user._id],
      eventType,
      ticketPrice: eventType === 'Paid' ? ticketPrice : 0,
      coverImage
    });

    await club.save();
    logger.info(`Club "${name}" created by admin ${req.user.email}`);
    res.status(201).json({ message: 'Club created successfully', club });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => console.error("Error deleting file on failure:", err));
    }
    next(error);
  }
};

exports.joinClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.clubId).populate('organizers', 'name');

    if (!club) return res.status(404).json({ message: 'Club not found.' });

    const userId = req.user._id;
    const alreadyMember = club.members.some(m => m.user.equals(userId));
    const alreadyOrganizer = club.organizers.some(o => o._id.equals(userId));

    if (alreadyMember || alreadyOrganizer) {
      return res.status(400).json({ message: 'You are already a member or organizer of this club.' });
    }

    if (club.eventType === 'Paid') {
      const transaction = new Transaction({
        sender: userId,
        receiver: club.organizers[0]._id,
        amount: club.ticketPrice,
        description: `Membership fee for joining ${club.name}`,
        status: 'Completed'
      });
      await transaction.save();
    }

    club.members.push({ user: userId });
    await club.save();

    await new Notification({
      user: userId,
      message: `Welcome to "${club.name}"! You are now a member.`,
      type: 'Club',
      relatedId: club._id
    }).save();

    logger.info(`${req.user.email} joined club "${club.name}"`);
    res.status(200).json({ message: 'Successfully joined the club.', club });
  } catch (error) {
    next(error);
  }
};

exports.getAllClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find().select('name description coverImage eventType ticketPrice');
    res.status(200).json(clubs);
  } catch (error) {
    next(error);
  }
};

exports.getClubDetails = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.clubId)
      .populate('organizers', 'name profilePicture')
      .populate('members.user', 'name profilePicture');

    if (!club) return res.status(404).json({ message: 'Club not found.' });
    res.status(200).json(club);
  } catch (error) {
    next(error);
  }
};
