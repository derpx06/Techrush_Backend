//models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: { 
    type: String,
    trim: true,
  },
  image: { 
    type: String,
  },
}, { timestamps: true });

messageSchema.pre('validate', function(next) {
    if (!this.content && !this.image) {
        next(new Error('Message must include either text content or an image.'));
    } else {
        next();
    }
});

module.exports = mongoose.model('Message', messageSchema);
