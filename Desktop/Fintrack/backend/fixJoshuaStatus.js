const mongoose = require('mongoose');
const { Attendance } = require('./models/Attendance');
require('dotenv').config();

async function fixStatus() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://stoniecap_db_user:tb8xT2iPI0RNmUer@fintrackcluster.xbtympo.mongodb.net/?appName=FintrackCluster';
    await mongoose.connect(mongoUri);
    
    // Update Joshua's attendance record
    const recordId = '6920a5baac26fce870104f84';
    
    const result = await Attendance.findByIdAndUpdate(
      recordId,
      { status: 'checked-out' },
      { new: true }
    ).populate('employee', 'firstName lastName');
    
    if (result) {
      console.log('✅ Updated attendance record successfully!');
      console.log(`Employee: ${result.employee.firstName} ${result.employee.lastName}`);
      console.log(`New Status: ${result.status}`);
      console.log(`Check-in: ${result.checkInTime}`);
      console.log(`Check-out: ${result.checkOutTime}`);
      console.log(`Total Hours: ${result.totalHours}`);
    } else {
      console.log('❌ Record not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixStatus();
