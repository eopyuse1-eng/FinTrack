const mongoose = require('mongoose');
require('dotenv').config();

const { Attendance } = require('./models/Attendance');
const { User } = require('./models/User');

async function checkAttendance() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB\n');

    const users = await User.find({
      role: { $in: ['employee', 'marketing_staff', 'treasury_staff'] },
    });

    for (const user of users) {
      console.log(`\n=== ${user.firstName} ${user.lastName} ===`);
      
      const attendance = await Attendance.find({
        employee: user._id,
        date: {
          $gte: new Date('2025-11-15'),
          $lte: new Date('2025-11-30'),
        },
      }).sort({ date: 1 });

      console.log(`Found ${attendance.length} attendance records`);
      if (attendance.length > 0) {
        console.log(`Date range: ${attendance[0].date.toDateString()} to ${attendance[attendance.length - 1].date.toDateString()}`);
        console.log(`First record:`, {
          date: attendance[0].date,
          checkInTime: attendance[0].checkInTime,
          checkOutTime: attendance[0].checkOutTime,
          status: attendance[0].status,
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAttendance();
