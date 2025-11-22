/**
 * Reset Payroll Data for Demo
 * Clears all payroll periods and records to demo from scratch
 * Run: node resetPayrollForDemo.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const PayrollPeriod = require('./models/PayrollPeriod');
const PayrollRecord = require('./models/PayrollRecord');
const Payslip = require('./models/Payslip');

async function resetPayrollForDemo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Count before deletion
    const periodCount = await PayrollPeriod.countDocuments();
    const recordCount = await PayrollRecord.countDocuments();
    const payslipCount = await Payslip.countDocuments();

    console.log('📊 Current Data:');
    console.log(`   Payroll Periods: ${periodCount}`);
    console.log(`   Payroll Records: ${recordCount}`);
    console.log(`   Payslips: ${payslipCount}\n`);

    // Delete all payroll data
    await PayrollPeriod.deleteMany({});
    await PayrollRecord.deleteMany({});
    await Payslip.deleteMany({});

    console.log('🗑️  Deleted all payroll data');
    console.log('✅ Database reset for demo!\n');
    console.log('📝 You can now:');
    console.log('   1. Initialize a new payroll period');
    console.log('   2. Compute payroll for employees');
    console.log('   3. Demo the approval workflow');
    console.log('   4. Lock the payroll period');
    console.log('   5. Generate payslips\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

resetPayrollForDemo();
