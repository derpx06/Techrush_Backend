// controllers/searchController.js
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Group = require('../models/Group');

exports.search = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const regex = new RegExp(query, 'i');
    const userId = req.user._id; 

    const [users, clubs, events, groups] = await Promise.all([
      User.find({ name: regex })
        .select('name profilePicture role')
        .limit(10),

      Club.find({ name: regex })
        .select('name coverImage description')
        .limit(10),

      Event.find({ title: regex, visibility: 'Public' })
        .select('title coverImage date')
        .limit(10),
        
      Group.find({ 
          name: regex, 
          'participants.user': userId 
        })
        .select('name description')
        .limit(10)
    ]);

    res.status(200).json({
      users,
      clubs,
      events,
      groups, 
    });

  } catch (error) {
    next(error);
  }
};
