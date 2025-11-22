/**
 * FinTrack Database Seeder with STRONG SEEDER ADMIN PROTECTION
 * Run with: node seed.js
 * 
 * Creates the initial Seeder Admin user with strong password validation
 * Run this ONCE during first-time setup
 * 
 * ⚠️  SECURITY:
 * - Only ONE Seeder Admin allowed per system
 * - Password must meet strict requirements (12+ chars, mixed case, numbers, special chars)
 * - Seeder Admin email is pre-verified
 * - All Seeder Admin actions are audited
 * - Cannot be deleted without database reset
 */

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();
const { User, ROLES } = require('./models/User');
const { AuditLog } = require('./models/AuditLog');
const passwordUtils = require('./utils/passwordUtils');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Check if Seeder Admin already exists (only one allowed)
    const existingSeederAdmin = await User.findOne({ role: 'seeder_admin' });
    if (existingSeederAdmin) {
      console.log('\n⚠️  SEEDER ADMIN ALREADY EXISTS!');
      console.log(`    Email: ${existingSeederAdmin.email}`);
      console.log('    Only ONE Seeder Admin is allowed per system\n');
      console.log('💡 To reset: Delete Seeder Admin from database and run again\n');
      process.exit(0);
    }

    // SEEDER ADMIN CREDENTIALS - VERY STRONG PASSWORD
    const SEEDER_EMAIL = 'seeder_admin@fintrack.com';
    const SEEDER_PASSWORD = 'FinTrack@Admin2025!SecurePass#'; // Exceeds strict requirements

    console.log('\n🔐 VALIDATING SEEDER ADMIN PASSWORD...\n');

    // Validate password meets STRICT Seeder Admin requirements
    const validation = passwordUtils.validateSeederAdminPassword(SEEDER_PASSWORD);
    
    if (!validation.isValid) {
      console.log('❌ PASSWORD VALIDATION FAILED');
      console.log('Errors:');
      validation.errors.forEach(err => console.log(`   - ${err}`));
      console.log('\n💡 Password must meet Seeder Admin requirements:');
      console.log('   ✓ Minimum 12 characters');
      console.log('   ✓ At least 1 uppercase (A-Z)');
      console.log('   ✓ At least 1 lowercase (a-z)');
      console.log('   ✓ At least 1 number (0-9)');
      console.log('   ✓ At least 1 special char (!@#$%^&*)');
      console.log('   ✗ No sequential patterns (123, abc)');
      console.log('   ✗ No repeated characters (AAA, 111)\n');
      process.exit(1);
    }

    console.log(`✅ Password Strength: ${validation.level}`);
    console.log(`   Security Score: ${validation.score}/100\n`);

    // Create Seeder Admin with security settings
    // NOTE: Do NOT hash password here - User model pre-save hook will handle it
    const seederAdmin = new User({
      firstName: 'Seeder',
      lastName: 'Admin',
      email: SEEDER_EMAIL,
      password: SEEDER_PASSWORD, // Plain password - will be hashed by pre-save hook
      role: ROLES.SEEDER_ADMIN,
      department: 'admin',
      isEmailVerified: true, // Pre-verified (no Gmail verification needed)
      isActive: true,
      birthdate: new Date(),
    });

    await seederAdmin.save();
    console.log('✓ Created Seeder Admin with STRONG password protection');

    // Audit log for Seeder Admin creation
    try {
      await AuditLog.create({
        user: seederAdmin._id,
        action: 'SEEDER_ADMIN_CREATED',
        details: 'System initialization - Seeder Admin account created',
        ipAddress: '127.0.0.1',
        timestamp: new Date(),
      });
    } catch (err) {
      // AuditLog model might not exist yet, continue anyway
      console.log('⚠️  Could not create audit log (model may not exist yet)');
    }

    // Display seeding result
    console.log(`
╔════════════════════════════════════════════════════════════╗
║      FinTrack Database Seeded with Secure Admin ✓         ║
╚════════════════════════════════════════════════════════════╝

🔐 SEEDER ADMIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email:       ${SEEDER_EMAIL}
🔑 Password:    ${SEEDER_PASSWORD}
👤 Role:        Seeder Admin
📍 Status:      Email Pre-Verified
🛡️  Security:    Strong (${validation.score}/100 score)

📝 NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Start backend: npm run dev
2. Login with Seeder Admin credentials
3. Create Supervisor account
4. ⚠️  Seeder Admin will be AUTOMATICALLY DISABLED
5. Supervisor creates HR Head
6. HR Head creates HR Staff & Employees

🔐 AUTO-DISABLE FEATURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
After you create the FIRST SUPERVISOR, the Seeder Admin account
will be AUTOMATICALLY DISABLED for security. This prevents
accidental misuse of the admin account. Supervisors take over
all system management from that point forward.

🔗 ROLE HIERARCHY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Seeder Admin (Disabled after init) → Supervisor → HR Head → HR Staff/Employees

⚠️  SECURITY REMINDERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Only ONE Seeder Admin allowed (enforced in system)
✓ Password meets strict security requirements
✓ Email pre-verified (no Gmail verification needed)
✓ All Seeder Admin actions are logged in audit trail
✓ Seeder Admin will be AUTO-DISABLED after first Supervisor created
✓ Supervisor takes over all management operations
✓ Cannot delete Seeder Admin without database reset
✓ In production: Save credentials in secure vault
✓ In production: Enable 2FA if available

🎯 FOR PRESENTATION/DEMO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Ready to login immediately (no Gmail verification)
✓ Demo flow: Seeder → Create Supervisor → Seeder gets disabled → Supervisor → HR Head → Employees
✓ Can showcase complete role hierarchy
✓ Can demonstrate payroll workflow

    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
