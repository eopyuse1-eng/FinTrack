/**
 * Debug script - Check demo users in database
 */
const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./models/User');
const bcryptjs = require('bcryptjs');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    const demoEmail = 'maria.santos@company.com';
    const user = await User.findOne({ email: demoEmail }).select('+password');
    
    if (!user) {
      console.log(`❌ User not found: ${demoEmail}`);
      process.exit(1);
    }

    console.log(`✓ User found: ${user.firstName} ${user.lastName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  isEmailVerified: ${user.isEmailVerified}`);
    console.log(`  Password hash exists: ${!!user.password}`);
    
    // Test password
    const isMatch = await bcryptjs.compare('password123', user.password);
    console.log(`  Password "password123" matches: ${isMatch}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
