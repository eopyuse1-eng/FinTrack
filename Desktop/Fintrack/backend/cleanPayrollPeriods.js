/**
 * Delete overlapping payroll periods for testing
 */

const mongoose = require('mongoose');
require('dotenv').config();

const PayrollPeriod = require('./models/PayrollPeriod');
const PayrollRecord = require('./models/PayrollRecord');
const GovernmentTaxTables = require('./models/GovernmentTaxTables');

async function deleteOverlappingPeriods() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Delete all payroll periods
    const result = await PayrollPeriod.deleteMany({});
    console.log(`✓ Deleted ${result.deletedCount} payroll periods`);

    // Delete all payroll records
    const recordResult = await PayrollRecord.deleteMany({});
    console.log(`✓ Deleted ${recordResult.deletedCount} payroll records`);

    // Delete old tax tables (to reseed with correct schema)
    const taxResult = await GovernmentTaxTables.deleteMany({});
    console.log(`✓ Deleted ${taxResult.deletedCount} tax table documents`);

    console.log('\n✅ Database cleaned! You can now initialize payroll with any dates.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteOverlappingPeriods();
