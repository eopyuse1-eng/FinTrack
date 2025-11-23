/**
 * Database Connection Manager
 * Handles MongoDB connection with retry logic and health checks
 */

const mongoose = require('mongoose');

let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

async function connectToDatabase(mongoUri) {
  try {
    console.log('🔄 Attempting MongoDB connection...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      socketKeepAliveEnabled: true,
      socketKeepAliveInitialDelay: 10000,
      retryWrites: true,
      family: 4, // Force IPv4
    });
    
    console.log('✅ MongoDB connected successfully');
    connectionAttempts = 0;
    return true;
  } catch (error) {
    connectionAttempts++;
    console.error(`❌ MongoDB connection failed (attempt ${connectionAttempts}/${MAX_RETRIES}):`, error.message);
    
    if (connectionAttempts < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectToDatabase(mongoUri);
    } else {
      console.error('❌ Max retry attempts reached. Database connection failed.');
      throw new Error('Failed to connect to MongoDB after multiple attempts');
    }
  }
}

function setupConnectionListeners() {
  mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  Mongoose disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ Mongoose reconnected to MongoDB');
  });
}

function isConnectionHealthy() {
  const state = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return state === 1;
}

module.exports = {
  connectToDatabase,
  setupConnectionListeners,
  isConnectionHealthy,
};
