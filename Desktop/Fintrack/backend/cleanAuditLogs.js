/**
 * Clean Audit Logs Script
 * Removes all old audit logs to start fresh for demo
 * Run: node cleanAuditLogs.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { AuditLog } = require('./models/AuditLog');

async function cleanAuditLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    const result = await AuditLog.deleteMany({});
    
    console.log(`✅ Cleanup Complete!`);
    console.log(`   Deleted: ${result.deletedCount} audit log entries\n`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

cleanAuditLogs();
