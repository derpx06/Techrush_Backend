const Notification = require('../models/Notification');

exports.createNotification = async (req, res, next) => {
  try {
    const { message, type, relatedId } = req.body;
    if (!message || !type) {
      return res.status(400).json({ message: 'Message and type are required.' });
    }
    const notification = new Notification({
      user: req.user._id,
      message,
      type,
      relatedId,
    });
    await notification.save();
    res.status(201).json({ message: 'Notification created', notification });
  } catch (error) {
    next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};