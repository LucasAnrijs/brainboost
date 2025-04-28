const mongoose = require('mongoose');
const config = require('./app');
const { logger } = require('../utils/logging/logger');

/**
 * Initialize MongoDB connection
 */
const initializeDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB at', uri);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB!');
    
    logger.info('MongoDB connection established successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error during MongoDB connection close:', err);
        process.exit(1);
      }
    });
    
    return mongoose.connection;
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};

module.exports = {
  initializeDatabase,
  connection: mongoose.connection,
};
