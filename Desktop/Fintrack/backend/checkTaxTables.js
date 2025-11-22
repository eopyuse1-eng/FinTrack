/**
 * Diagnostic script - Check what's in GovernmentTaxTables
 */

const mongoose = require('mongoose');
require('dotenv').config();

const GovernmentTaxTables = require('./models/GovernmentTaxTables');

async function checkTaxTables() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB\n');

    const taxTables = await GovernmentTaxTables.findOne();

    if (!taxTables) {
      console.log('❌ NO TAX TABLES FOUND IN DATABASE');
      process.exit(1);
    }

    console.log('Tax Tables Document:');
    console.log('ID:', taxTables._id);
    console.log('\nSSS Contributions:', taxTables.sssContributions ? taxTables.sssContributions.length : 'undefined');
    console.log('PhilHealth Contributions:', taxTables.philhealthContributions ? taxTables.philhealthContributions.length : 'undefined');
    console.log('Pag-IBIG Contributions:', taxTables.pagibigContributions ? taxTables.pagibigContributions.length : 'undefined');
    console.log('Withholding Tax Brackets:', taxTables.withholdingTaxBrackets ? taxTables.withholdingTaxBrackets.length : 'undefined');

    console.log('\n--- Full Tax Tables ---');
    console.log(JSON.stringify(taxTables, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkTaxTables();
