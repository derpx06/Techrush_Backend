// controllers/clubController.js
const Club = require('../models/Club');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const fs = require('fs').promises;

// Create a Club
exports.createClub = async (req, res, next) => {
  try {
    const { name, description, membershipType, subscriptionFee, subscriptionFrequency } = req.body;

    if (!name || !description) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'Club name and description are required.' });
    }

    if (membershipType === 'Subscription' && (!subscriptionFee || subscriptionFee <= 0)) {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(400).json({ message: 'Subscription-based clubs must have a fee greater than zero.' });
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
        membershipType,
        subscriptionFee: membershipType === 'Subscription' ? subscriptionFee : 0,
        subscriptionFrequency: membershipType === 'Subscription' ? subscriptionFrequency : null,
        coverImage: coverImage,
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

// Add a new organizer
exports.addOrganizer = async (req, res, next) => {
    try {
        const { clubId } = req.params;
        const { newOrganizerId } = req.body;

        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ message: 'Club not found.' });
        }

        if (!club.organizers.includes(req.user._id)) {
            return res.status(403).json({ message: 'Forbidden. Only existing organizers can add new ones.' });
        }

        const newOrganizer = await User.findById(newOrganizerId);
        if (!newOrganizer) {
            return res.status(404).json({ message: 'User to be added as organizer not found.' });
        }
        if (club.organizers.includes(newOrganizerId)) {
            return res.status(400).json({ message: 'This user is already an organizer.' });
        }

        club.organizers.push(newOrganizerId);
        club.members = club.members.filter(member => !member.user.equals(newOrganizerId));
        
        await club.save();

        await new Notification({
            user: newOrganizerId,
            message: `You have been made an organizer for the club: "${club.name}".`,
            type: 'Club',
            relatedId: club._id,
        }).save();

        logger.info(`User ${newOrganizerId} was added as an organizer to "${club.name}" by ${req.user.email}`);
        res.status(200).json({ message: 'New organizer added successfully.', club });

    } catch (error) {
        next(error);
    }
};

// Get all clubs
exports.getAllClubs = async (req, res, next) => {
    try {
        const clubs = await Club.find().select('name description coverImage membershipType');
        res.status(200).json(clubs);
    } catch (error) {
        next(error);
    }
};

//GetclubDetails Request
exports.getClubDetails = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.clubId)
            .populate('organizers', 'name profilePicture')
            .populate('members.user', 'name profilePicture')
            .populate('pendingRequests', 'name profilePicture');

        if (!club) {
            return res.status(404).json({ message: 'Club not found.' });
        }
        res.status(200).json(club);
    } catch (error) {
        next(error);
    }
};

//JoinClubRequest
exports.requestToJoinClub = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.clubId);
        if (!club) {
            return res.status(404).json({ message: 'Club not found.' });
        }

        const userId = req.user._id;

        if (club.members.some(m => m.user.equals(userId)) || club.organizers.includes(userId)) {
            return res.status(400).json({ message: 'You are already a member of this club.' });
        }
        if (club.pendingRequests.includes(userId)) {
            return res.status(400).json({ message: 'You already have a pending request to join this club.' });
        }

        club.pendingRequests.push(userId);
        await club.save();
        
        const notifications = club.organizers.map(orgId => ({
            user: orgId,
            message: `${req.user.name} has requested to join your club, "${club.name}".`,
            type: 'Club',
            relatedId: club._id,
        }));
        await Notification.insertMany(notifications);

        logger.info(`${req.user.email} requested to join club "${club.name}"`);
        res.status(200).json({ message: 'Your request to join the club has been sent.' });
    } catch (error) {
        next(error);
    }
};

// Manage a join request
exports.manageJoinRequest = async (req, res, next) => {
    try {
        const { studentId, action } = req.body;
        if (!['approve', 'deny'].includes(action)) {
            return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'deny'." });
        }

        const club = await Club.findById(req.params.clubId);
        if (!club) {
            return res.status(404).json({ message: 'Club not found.' });
        }

        if (!club.organizers.includes(req.user._id)) {
            return res.status(403).json({ message: 'Forbidden. Only club organizers can manage requests.' });
        }

        if (!club.pendingRequests.includes(studentId)) {
            return res.status(404).json({ message: 'This user does not have a pending request.' });
        }
        
        let notificationMessage = '';
        let responseMessage = '';

        if (action === 'approve') {
            if (club.membershipType === 'Subscription') {
                notificationMessage = `Your request to join "${club.name}" has been approved! Please pay the fee of ₹${club.subscriptionFee} to finalize your membership.`;
                responseMessage = `Request approved. User has been notified to pay the membership fee.`;
            } else {
                club.pendingRequests = club.pendingRequests.filter(id => !id.equals(studentId));
                club.members.push({ user: studentId });
                notificationMessage = `Your request to join "${club.name}" has been approved. Welcome to the club!`;
                responseMessage = `Request has been successfully approved.`;
            }
            logger.info(`Request from ${studentId} to join "${club.name}" was approved by ${req.user.email}`);
        } else {
            club.pendingRequests = club.pendingRequests.filter(id => !id.equals(studentId));
            notificationMessage = `We're sorry, but your request to join "${club.name}" has been denied.`;
            responseMessage = `Request has been successfully denied.`;
            logger.info(`Request from ${studentId} to join "${club.name}" was denied by ${req.user.email}`);
        }
        
        await club.save();

        await new Notification({
            user: studentId,
            message: notificationMessage,
            type: 'Club',
            relatedId: club._id
        }).save();

        res.status(200).json({ message: responseMessage, club });
    } catch (error) {
        next(error);
    }
};

// Pay membership fee
exports.payMembershipFee = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.clubId).populate('organizers');
        if (!club) {
            return res.status(404).json({ message: 'Club not found.' });
        }
        
        const userId = req.user._id;

        if (club.membershipType !== 'Subscription') {
            return res.status(400).json({ message: 'This club does not require a payment.' });
        }
        if (!club.pendingRequests.includes(userId)) {
            return res.status(400).json({ message: 'You do not have an approved request to pay for.' });
        }
        if (club.members.some(m => m.user.equals(userId))) {
            return res.status(400).json({ message: 'You are already a member of this club.' });
        }

        const newTransaction = new Transaction({
            sender: userId,
            receiver: club.organizers[0]._id,
            amount: club.subscriptionFee,
            description: `Membership fee for ${club.name}`,
            status: 'Completed'
        });
        await newTransaction.save();

        club.pendingRequests = club.pendingRequests.filter(id => !id.equals(userId));
        club.members.push({ user: userId });
        await club.save();

        await new Notification({
            user: userId,
            message: `Payment successful! Your membership for "${club.name}" is now active. Welcome!`,
            type: 'Club',
            relatedId: club._id
        }).save();

        logger.info(`${req.user.email} paid membership for club "${club.name}"`);
        res.status(200).json({ message: 'Payment successful! You are now a member of the club.', club });

    } catch (error) {
        next(error);
    }
};
