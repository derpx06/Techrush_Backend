const mongoose = require('mongoose');

  const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuspay', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB Connected...');
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
      setTimeout(connectDB, 5000); // Retry after 5 seconds
    }
  };

  module.exports = connectDB;