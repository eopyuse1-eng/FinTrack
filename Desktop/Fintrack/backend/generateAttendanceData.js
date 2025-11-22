/**
 * Generate attendance data for demo purposes
 * Creates 16 days of attendance (Nov 15-30, 2025) for Joshua
 * Run: node generateAttendanceData.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Attendance } = require('./models/Attendance');
const { User } = require('./models/User');

dotenv.config();

// Philippine timezone offset (UTC+8)
const PH_TIMEZONE_OFFSET = 8 * 60 * 60 * 1000;

// Working days: Monday-Saturday
const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // Mon-Sat

// Standard work hours: 9 AM - 5 PM (8 hours) + 1 hour lunch = 9 hours worked
const CHECK_IN_HOUR = 9;
const CHECK_OUT_HOUR = 17;
const LUNCH_BREAK_MINUTES = 60;

async function generateAttendanceData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://admin:password@cluster0.mongodb.net/fintrack';
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Find Joshua (employee)
    const joshua = await User.findOne({ firstName: 'Joshua', lastName: 'Marcelino' });
    if (!joshua) {
      console.log('✗ Joshua Marcelino not found');
      process.exit(1);
    }
    console.log(`✓ Found employee: ${joshua.firstName} ${joshua.lastName}`);

    // Delete existing attendance for Nov 15-30
    const startDate = new Date(2025, 10, 15); // Nov 15
    const endDate = new Date(2025, 10, 31); // Nov 31
    const deletedCount = await Attendance.deleteMany({
      employee: joshua._id,
      date: { $gte: startDate, $lt: endDate },
    });
    console.log(`✓ Deleted ${deletedCount.deletedCount} existing records`);

    // Generate attendance for Nov 15-30
    const attendanceRecords = [];
    let recordCount = 0;

    for (let day = 15; day <= 30; day++) {
      const date = new Date(2025, 10, day); // Nov 15-30
      const dayOfWeek = date.getDay();

      // Skip Sundays (dayOfWeek = 0)
      if (dayOfWeek === 0) {
        console.log(`  Skipped Nov ${day} (Sunday)`);
        continue;
      }

      // Create check-in time (9:00 AM - 9:15 AM)
      const checkInTime = new Date(date);
      checkInTime.setHours(9, Math.floor(Math.random() * 16), 0, 0); // 9:00-9:15

      // Create check-out time (5:00 PM - 5:15 PM)
      const checkOutTime = new Date(date);
      checkOutTime.setHours(17, Math.floor(Math.random() * 16), 0, 0); // 5:00-5:15

      // Calculate total hours (accounting for lunch break)
      const totalMs = checkOutTime - checkInTime;
      const totalHours = (totalMs / (1000 * 60 * 60)) - (LUNCH_BREAK_MINUTES / 60);

      const attendance = new Attendance({
        employee: joshua._id,
        date: new Date(date.setHours(0, 0, 0, 0)),
        checkInTime,
        checkOutTime,
        totalHours: Math.round(totalHours * 100) / 100,
        status: checkOutTime ? 'checked-out' : 'present',
        department: joshua.department || 'Marketing',
        remarks: 'Auto-generated for demo',
      });

      attendanceRecords.push(attendance);
      recordCount++;
      console.log(
        `  ✓ Nov ${day}: ${checkInTime.toLocaleTimeString()} - ${checkOutTime.toLocaleTimeString()} (${attendance.totalHours}h)`
      );
    }

    // Save all records
    if (attendanceRecords.length > 0) {
      await Attendance.insertMany(attendanceRecords);
      console.log(
        `\n✓ Generated ${recordCount} attendance records for Nov 15-30 ✓`
      );
      console.log(`✓ Total working days: ${recordCount}`);
    } else {
      console.log('✗ No attendance records generated');
    }

    // Show summary
    console.log('\n📊 Attendance Summary:');
    const totalHours = attendanceRecords.reduce((sum, r) => sum + r.totalHours, 0);
    console.log(`   Days recorded: ${recordCount}`);
    console.log(`   Total hours: ${totalHours}h`);
    console.log(`   Average per day: ${(totalHours / recordCount).toFixed(2)}h`);
    console.log('\n✓ Ready for payroll computation!');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error generating attendance:', error.message);
    process.exit(1);
  }
}

generateAttendanceData();
