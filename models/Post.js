// models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim: true
    },
    image: {
        type: String
    }
}, { timestamps: true });

postSchema.pre('validate', function(next) {
    if (!this.content && !this.image) {
        next(new Error('Post must include either text content or an image.'));
    } else {
        next();
    }
});

module.exports = mongoose.model('Post', postSchema);
