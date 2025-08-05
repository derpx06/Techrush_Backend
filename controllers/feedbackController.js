// controllers/feedbackController.js
const Feedback = require('../models/Feedback');

exports.submitFeedback = async (req, res, next) => {
  try {
    const { message, rating } = req.body;
    const feedback = new Feedback({
      user: req.user.id,
      message,
      rating,
    });
    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
};

exports.getFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find().populate('user', 'name');
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};