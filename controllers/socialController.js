const Post = require('../models/Post');
const fs = require('fs').promises;
const logger = require('../utils/logger');


exports.shareActivity = async (req, res, next) => {
    try {
        const { content } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!content && !imagePath) {
              return res.status(400).json({ message: 'Post must include text or an image.' });
        }

        const post = new Post({
            author: req.user._id,
            content: content || '',
            image: imagePath,
        });

        await post.save();
        const populatedPost = await Post.findById(post._id).populate('author', 'name profilePicture');

        logger.info(`New post created by ${req.user.email}`);
        res.status(201).json({ message: 'Post shared successfully', post: populatedPost });
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error deleting file on failure:", err));
        }
        next(error);
    }
};

exports.getCommunityActivity = async (req, res, next) => {
    try {
        const posts = await Post.find()
            .populate('author', 'name profilePicture')
            .sort({ createdAt: -1 })
            .limit(50); 

        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
};
