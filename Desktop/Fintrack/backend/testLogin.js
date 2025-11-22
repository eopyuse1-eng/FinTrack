/**
 * Test login directly
 */
const mongoose = require('mongoose');
require('dotenv').config();
const bcryptjs = require('bcryptjs');
const { User } = require('./models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    const email = 'maria.santos@company.com';
    const password = 'Password123';

    console.log(`Testing login: ${email} / ${password}\n`);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log(`✓ User found:`);
    console.log(`  Name: ${user.firstName} ${user.lastName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  isEmailVerified: ${user.isEmailVerified}`);
    console.log(`  isDisabled: ${user.isDisabled}`);
    console.log(`  Password hash: ${user.password.substring(0, 20)}...`);

    // Test password
    const isMatch = await bcryptjs.compare(password, user.password);
    console.log(`\n  Password match: ${isMatch}`);

    if (isMatch) {
      console.log('\n✅ LOGIN WOULD SUCCEED!');
    } else {
      console.log('\n❌ PASSWORD DOES NOT MATCH');
      console.log('\nTesting other passwords...');
      const testPasswords = ['password123', 'Password123', 'PASSWORD123', 'password'];
      for (const pwd of testPasswords) {
        const match = await bcryptjs.compare(pwd, user.password);
        console.log(`  "${pwd}": ${match}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
