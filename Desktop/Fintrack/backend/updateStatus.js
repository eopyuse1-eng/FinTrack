const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { Attendance } = require('./models/Attendance');
require('dotenv').config();

async function fixStatus() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://stoniecap_db_user:tb8xT2iPI0RNmUer@fintrackcluster.xbtympo.mongodb.net/?appName=FintrackCluster';
    await mongoose.connect(mongoUri);
    
    // Update Joshua's attendance record - find by employee ID and date
    const employeeId = new ObjectId('69209b2535316e75faebe38e');
    
    // Find first
    const record = await Attendance.findOne({ employee: employeeId }).populate('employee');
    
    if (record) {
      console.log('Found record:', record._id);
      console.log('Current status:', record.status);
      
      // Update the status
      record.status = 'checked-out';
      await record.save();
      
      console.log('✅ Updated successfully!');
      console.log(`Employee: ${record.employee.firstName} ${record.employee.lastName}`);
      console.log(`New Status: ${record.status}`);
      console.log(`Total Hours: ${record.totalHours}`);
    } else {
      console.log('❌ No record found for this employee');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixStatus();
