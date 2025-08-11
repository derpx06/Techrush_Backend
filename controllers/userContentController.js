const Club = require('../models/Club');
const Event = require('../models/Event');
const Post = require('../models/Post');
const User = require('../models/User');

exports.getMyContent = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const [clubs, events, posts] = await Promise.all([
            Club.find({
                $or: [
                    { 'members.user': userId },
                    { organizers: userId }
                ]
            }).populate('organizers', 'name profilePicture').populate('members.user', 'name profilePicture'),
            
            Event.find({ attendees: userId })
                 .populate('creator', 'name profilePicture')
                 .populate('attendees', 'name profilePicture'),

            Post.find({ author: userId })
                .populate('author', 'name profilePicture')
                .sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            clubs,
            events,
            posts
        });

    } catch (error) {
        next(error);
    }
};
