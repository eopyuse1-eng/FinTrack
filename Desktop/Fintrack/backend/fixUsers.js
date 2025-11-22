/**
 * Fix demo users - let mongoose pre-save hook hash the password
 */
const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./models/User');

async function fixUsers() {
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

    // Create new demo users - let mongoose hash the password
    const demoUsers = [
      {
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@company.com',
        password: 'Password123',  // Will be hashed by mongoose pre-save hook
        role: 'hr_head',
        department: 'admin',
        birthDate: new Date('1990-05-15'),
        address: '123 HR Street',
        phone: '09123456789',
        isEmailVerified: true,
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
        isEmailVerified: true,
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
        isEmailVerified: true,
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
        isEmailVerified: true,
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
        isEmailVerified: true,
      },
    ];

    console.log('✨ Creating new demo users (password will be auto-hashed)...');
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`   ✓ ${userData.firstName} ${userData.lastName}`);
    }

    console.log('\n✅ Demo Users Fixed!');
    console.log('📋 Login Credentials:');
    console.log('   maria.santos@company.com / Password123');
    console.log('   juan.cruz@company.com / Password123');
    console.log('   joshua.marcelino@company.com / Password123');
    console.log('   lj.tanauan@company.com / Password123');
    console.log('   ana.garcia@company.com / Password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUsers();
