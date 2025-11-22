/**
 * Delete all demo users and recreate with correct password
 */
const mongoose = require('mongoose');
require('dotenv').config();
const bcryptjs = require('bcryptjs');
const { User } = require('./models/User');

async function resetDemoUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Delete existing demo users
    const demoEmails = [
      'maria.santos@company.com',
      'juan.cruz@company.com',
      'joshua.marcelino@company.com',
      'lj.tanauan@company.com',
      'ana.garcia@company.com',
    ];

    console.log('🗑️  Deleting existing demo users...');
    const deleteResult = await User.deleteMany({ email: { $in: demoEmails } });
    console.log(`   Deleted: ${deleteResult.deletedCount} users\n`);

    // Create new demo users with Password123
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

    console.log('✨ Creating new demo users...');
    for (const userData of demoUsers) {
      const hashedPassword = await bcryptjs.hash(userData.password, 8);
      const user = new User({
        ...userData,
        password: hashedPassword,
        isEmailVerified: true,
      });
      await user.save();
      console.log(`   ✓ ${userData.firstName} ${userData.lastName}`);
    }

    console.log('\n✅ Demo Setup Complete!');
    console.log('📋 Demo Users Ready:');
    console.log('   maria.santos@company.com / Password123 (HR Head)');
    console.log('   juan.cruz@company.com / Password123 (HR Staff)');
    console.log('   joshua.marcelino@company.com / Password123 (Employee)');
    console.log('   lj.tanauan@company.com / Password123 (Employee)');
    console.log('   ana.garcia@company.com / Password123 (Employee)\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

resetDemoUsers();
