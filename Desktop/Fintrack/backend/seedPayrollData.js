/**
 * SEED SCRIPT - Add test payroll data
 * Run: node seedPayrollData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('./models/User');
const EmployeeSalaryConfig = require('./models/EmployeeSalaryConfig');
const GovernmentTaxTables = require('./models/GovernmentTaxTables');
const { Attendance } = require('./models/Attendance');

async function seedPayrollData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // 1. Seed Government Tax Tables (if not exists)
    let taxTables = await GovernmentTaxTables.findOne();
    if (!taxTables) {
      taxTables = new GovernmentTaxTables({
        sssContributions: [
          { salaryRange: { min: 1000, max: 1249.99 }, monthlyContribution: 110 },
          { salaryRange: { min: 1250, max: 1499.99 }, monthlyContribution: 137.50 },
          { salaryRange: { min: 1500, max: 1749.99 }, monthlyContribution: 165 },
          { salaryRange: { min: 1750, max: 1999.99 }, monthlyContribution: 192.50 },
          { salaryRange: { min: 2000, max: 2249.99 }, monthlyContribution: 220 },
          { salaryRange: { min: 2250, max: 2499.99 }, monthlyContribution: 247.50 },
          { salaryRange: { min: 2500, max: 100000 }, monthlyContribution: 275 },
        ],
        philhealthContributions: [
          { salaryRange: { min: 0, max: 10000 }, monthlyContribution: 0 },
          { salaryRange: { min: 10000.01, max: 40000 }, monthlyContribution: 137.50 },
          { salaryRange: { min: 40000.01, max: 100000 }, monthlyContribution: 550 },
        ],
        pagibigContributions: [
          { salaryRange: { min: 1500, max: 4999.99 }, monthlyContribution: 50 },
          { salaryRange: { min: 5000, max: 100000 }, monthlyContribution: 100 },
        ],
        withholdingTaxBrackets: [
          { incomeRange: { min: 0, max: 250000 }, taxRate: 0, fixedTaxAmount: 0, description: 'Not Subject to Tax' },
          { incomeRange: { min: 250000.01, max: 400000 }, taxRate: 15, fixedTaxAmount: -37500, description: '15%' },
          { incomeRange: { min: 400000.01, max: 800000 }, taxRate: 20, fixedTaxAmount: -97500, description: '20%' },
          { incomeRange: { min: 800000.01, max: 2000000 }, taxRate: 25, fixedTaxAmount: -297500, description: '25%' },
          { incomeRange: { min: 2000000.01, max: 100000000 }, taxRate: 30, fixedTaxAmount: -797500, description: '30%' },
        ],
      });
      await taxTables.save();
      console.log('✓ Government tax tables seeded');
    } else {
      // Update existing tax tables with withholding brackets if they're empty
      if (!taxTables.withholdingTaxBrackets || taxTables.withholdingTaxBrackets.length === 0) {
        const result = await GovernmentTaxTables.updateOne(
          { _id: taxTables._id },
          {
            $set: {
              withholdingTaxBrackets: [
                { incomeRange: { min: 0, max: 250000 }, taxRate: 0, fixedTaxAmount: 0, description: 'Not Subject to Tax' },
                { incomeRange: { min: 250000.01, max: 400000 }, taxRate: 15, fixedTaxAmount: -37500, description: '15%' },
                { incomeRange: { min: 400000.01, max: 800000 }, taxRate: 20, fixedTaxAmount: -97500, description: '20%' },
                { incomeRange: { min: 800000.01, max: 2000000 }, taxRate: 25, fixedTaxAmount: -297500, description: '25%' },
                { incomeRange: { min: 2000000.01, max: 100000000 }, taxRate: 30, fixedTaxAmount: -797500, description: '30%' },
              ],
            },
          }
        );
        console.log('✓ Updated tax tables with withholding brackets - Result:', result.modifiedCount > 0 ? 'Success' : 'No change');
      } else {
        console.log('✓ Government tax tables already exist with brackets');
      }
    }

    // 2. Get all employees and create salary configs
    const employees = await User.find({
      role: { $in: ['employee', 'marketing_staff', 'treasury_staff'] },
    });

    console.log(`Found ${employees.length} employees`);

    for (const employee of employees) {
      const existingConfig = await EmployeeSalaryConfig.findOne({ employee: employee._id });

      if (!existingConfig) {
        const salaryConfig = new EmployeeSalaryConfig({
          employee: employee._id,
          salaryType: 'daily_rate',
          dailyRate: 1363.64, // ~30k/month
          monthlyRate: 30000,
          hourlyRate: 170.45,
          workSchedule: 'monday_saturday',
          allowances: [
            {
              name: 'Meal Allowance',
              amount: 200,
              isRecurring: true,
              isMonthly: true,
            },
          ],
          deductions: [],
          overtimeRate: 1.25,
          nightDifferentialRate: 1.10,
          specialHolidayRate: 1.30,
          regularHolidayRate: 2.00,
          taxFilingStatus: 'single',
          numberOfDependents: 0,
        });
        await salaryConfig.save();
        console.log(`✓ Created salary config for ${employee.firstName} ${employee.lastName}`);
      }
    }

    // 3. Add attendance records for testing (Nov 15-30, 2025 payroll period)
    // PH Time is UTC+8
    const PH_OFFSET = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    
    // First, delete old attendance records for this period
    await Attendance.deleteMany({
      date: {
        $gte: new Date('2025-11-15'),
        $lte: new Date('2025-11-30'),
      },
    });

    for (const employee of employees) {
      // Create attendance records for Nov 15-30, 2025 (working days only, Mon-Sat)
      let daysAdded = 0;
      for (let day = 15; day <= 30 && daysAdded < 16; day++) {
        const dateStr = `2025-11-${day}`;
        const date = new Date(dateStr);
        
        const dayOfWeek = date.getDay();
        // Skip Sundays (0 = Sunday, 1-6 = Mon-Sat)
        if (dayOfWeek !== 0) {
          const existingAttendance = await Attendance.findOne({
            employee: employee._id,
            date: {
              $gte: new Date(dateStr),
              $lt: new Date(`2025-11-${day + 1}`),
            },
          });

          if (!existingAttendance) {
            // Create dates in PH time (UTC+8)
            const baseDateUTC = new Date(dateStr);
            const checkInUTC = new Date(baseDateUTC.getTime() - PH_OFFSET);
            checkInUTC.setUTCHours(0, 0, 0, 0);
            checkInUTC.setTime(checkInUTC.getTime() + PH_OFFSET); // 8:00 AM PH time
            
            const checkOutUTC = new Date(baseDateUTC.getTime() - PH_OFFSET);
            checkOutUTC.setUTCHours(9, 0, 0, 0);
            checkOutUTC.setTime(checkOutUTC.getTime() + PH_OFFSET); // 5:00 PM PH time (9 hours later)

            const attendance = new Attendance({
              employee: employee._id,
              department: employee.department || 'HR',
              date: new Date(dateStr),
              checkInTime: checkInUTC,
              checkOutTime: checkOutUTC,
              status: 'present',
              hoursWorked: 9,
            });
            await attendance.save();
            daysAdded++;
            console.log(`✓ Added attendance for ${employee.firstName} on ${date.toDateString()}`);
          }
        }
      }
    }

    console.log('\n✅ Payroll data seeding completed!');
    console.log('\nNow you can:');
    console.log('1. Go to Payroll → Initialize & Compute');
    console.log('2. Create a payroll period');
    console.log('3. Compute salaries');
    console.log('4. HR Head can then approve and generate payslips');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedPayrollData();
