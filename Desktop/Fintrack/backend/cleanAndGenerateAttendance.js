/**
 * Clean old attendance records and generate fresh data for all employees
 * Run: node cleanAndGenerateAttendance.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { Attendance } = require('./models/Attendance');
const { User } = require('./models/User');

async function cleanAndGenerateAttendance() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Delete all old attendance records
    console.log('🗑️  Cleaning old attendance records...');
    const deleteResult = await Attendance.deleteMany({});
    console.log(`✓ Deleted ${deleteResult.deletedCount} old records\n`);

    // Get all employees
    const employees = await User.find({ role: { $in: ['employee', 'hr_staff'] } });
    console.log(`✓ Found ${employees.length} employees\n`);

    // Generate attendance for each employee
    for (const employee of employees) {
      console.log(`📝 Generating attendance for ${employee.firstName} ${employee.lastName}...`);
      
      const startDate = new Date('2025-11-15');
      const endDate = new Date('2025-11-29');
      let recordsCreated = 0;

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Skip Sundays (day 0)
        if (d.getDay() === 0) continue;

        const date = new Date(d);
        date.setHours(0, 0, 0, 0);

        // Random check-in time between 8:00 AM and 9:30 AM
        const checkInHour = 8 + Math.random() * 1.5;
        const checkInMinutes = Math.floor((checkInHour % 1) * 60);
        const checkInTime = new Date(date);
        checkInTime.setHours(Math.floor(checkInHour), checkInMinutes, 0);

        // Random check-out time between 5:00 PM and 5:30 PM
        const checkOutHour = 17 + Math.random() * 0.5;
        const checkOutMinutes = Math.floor((checkOutHour % 1) * 60);
        const checkOutTime = new Date(date);
        checkOutTime.setHours(Math.floor(checkOutHour), checkOutMinutes, 0);

        // Calculate total hours
        const totalMs = checkOutTime - checkInTime;
        const totalHours = Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;

        const attendance = new Attendance({
          employee: employee._id,
          date: date,
          department: employee.department,
          checkInTime: checkInTime,
          checkOutTime: checkOutTime,
          status: 'checked-out',
          totalHours: totalHours,
        });

        await attendance.save();
        recordsCreated++;
      }

      console.log(`   ✓ Created ${recordsCreated} attendance records\n`);
    }

    console.log('✅ Attendance data regenerated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

cleanAndGenerateAttendance();
