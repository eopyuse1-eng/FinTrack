const mongoose = require('mongoose');
const { Attendance } = require('./models/Attendance');
const { User } = require('./models/User');
require('dotenv').config();

async function checkData() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://stoniecap_db_user:tb8xT2iPI0RNmUer@fintrackcluster.xbtympo.mongodb.net/?appName=FintrackCluster';
    await mongoose.connect(mongoUri);
    
    const attendanceCount = await Attendance.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`Total Attendance Records: ${attendanceCount}`);
    console.log(`Total Users: ${userCount}`);
    
    if (attendanceCount > 0) {
      const records = await Attendance.find({}).limit(5).populate('employee');
      console.log('\nFirst 5 Attendance Records:');
      records.forEach(r => {
        console.log(`- Employee: ${r.employee ? r.employee.firstName + ' ' + r.employee.lastName : 'Unknown'} - Status: ${r.status}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
