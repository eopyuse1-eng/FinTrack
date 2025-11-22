/**
 * Quick Demo Setup Script
 * Creates all demo users for presentation (Nov 22)
 * Run: node setupDemoUsers.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const bcryptjs = require('bcryptjs');
const { User } = require('./models/User');

async function setupDemoUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Demo user configurations
    const demoUsers = [
      {
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@company.com',
        password: 'Password123',
        role: 'hr_head',
        department: 'admin',
        birthDate: new Date('1990-05-15'),
        address: '123 HR Street',
        phone: '09123456789',
      },
      {
        firstName: 'Juan',
        lastName: 'Cruz',
        email: 'juan.cruz@company.com',
        password: 'Password123',
        role: 'hr_staff',
        department: 'hr',
        birthDate: new Date('1992-07-20'),
        address: '456 HR Avenue',
        phone: '09123456790',
      },
      {
        firstName: 'Joshua',
        lastName: 'Marcelino',
        email: 'joshua.marcelino@company.com',
        password: 'Password123',
        role: 'employee',
        department: 'marketing',
        birthDate: new Date('1995-03-10'),
        address: '789 Market Street',
        phone: '09123456791',
      },
      {
        firstName: 'LJ',
        lastName: 'Tanauan',
        email: 'lj.tanauan@company.com',
        password: 'Password123',
        role: 'employee',
        department: 'marketing',
        birthDate: new Date('1996-08-25'),
        address: '101 Marketing Blvd',
        phone: '09123456792',
      },
      {
        firstName: 'Ana',
        lastName: 'Garcia',
        email: 'ana.garcia@company.com',
        password: 'Password123',
        role: 'employee',
        department: 'treasury',
        birthDate: new Date('1993-11-30'),
        address: '202 Finance Road',
        phone: '09123456793',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⏭ ${userData.firstName} ${userData.lastName} already exists`);
        skippedCount++;
        continue;
      }

      // Create user - mongoose pre-save hook will hash the password
      const user = new User({
        ...userData,
        isEmailVerified: true, // Demo users can use local login immediately
      });

      await user.save();
      createdCount++;
      console.log(`✓ Created: ${userData.firstName} ${userData.lastName} (${userData.role}) - ${userData.department}`);
    }

    console.log(`\n✅ Demo Setup Complete!`);
    console.log(`   Created: ${createdCount} users`);
    console.log(`   Skipped: ${skippedCount} users\n`);

    console.log('📋 Demo Users Ready:');
    console.log('   HR Head: maria.santos@company.com / Password123');
    console.log('   HR Staff: juan.cruz@company.com / Password123');
    console.log('   Marketing (Joshua): joshua.marcelino@company.com / Password123');
    console.log('   Marketing (LJ): lj.tanauan@company.com / Password123');
    console.log('   Treasury: ana.garcia@company.com / Password123\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

setupDemoUsers();
