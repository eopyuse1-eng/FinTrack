/**
 * Update demo users to have isEmailVerified = true
 */
const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./models/User');

async function updateDemoUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    const demoEmails = [
      'maria.santos@company.com',
      'juan.cruz@company.com',
      'joshua.marcelino@company.com',
      'lj.tanauan@company.com',
      'ana.garcia@company.com',
    ];

    for (const email of demoEmails) {
      const result = await User.updateOne(
        { email },
        { isEmailVerified: true }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✓ Updated: ${email} - isEmailVerified = true`);
      } else {
        console.log(`⏭ No changes: ${email}`);
      }
    }

    console.log('\n✅ All demo users updated!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

updateDemoUsers();
