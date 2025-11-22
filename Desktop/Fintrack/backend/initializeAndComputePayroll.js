const mongoose = require('mongoose');
const { User } = require('./models/User');
const PayrollPeriod = require('./models/PayrollPeriod');
const PayrollRecord = require('./models/PayrollRecord');
const Payslip = require('./models/Payslip');
const { Attendance } = require('./models/Attendance');
const EmployeeSalaryConfig = require('./models/EmployeeSalaryConfig');
const GovernmentTaxTables = require('./models/GovernmentTaxTables');
require('dotenv').config();

// Tax calculation function
function calculateWithholdinTax(taxableIncome, taxTables) {
  if (!taxTables || !Array.isArray(taxTables.withholdingTaxBrackets) || taxTables.withholdingTaxBrackets.length === 0) {
    console.warn('Warning: Tax brackets not found, returning 0 tax');
    return 0;
  }

  const brackets = taxTables.withholdingTaxBrackets;
  let tax = 0;

  for (let bracket of brackets) {
    if (taxableIncome > bracket.minIncome) {
      const incomeInBracket = Math.min(taxableIncome, bracket.maxIncome) - bracket.minIncome;
      tax += incomeInBracket * (bracket.taxRate / 100);
    }
  }

  return tax;
}

async function computePayroll() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://stoniecap_db_user:tb8xT2iPI0RNmUer@fintrackcluster.xbtympo.mongodb.net/?appName=FintrackCluster';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Step 1: Create Payroll Period
    const startDate = new Date('2025-11-15');
    const endDate = new Date('2025-11-30');

    const period = new PayrollPeriod({
      periodName: 'November 2025 (2nd Half)',
      startDate: startDate,
      endDate: endDate,
      payrollCycle: 'semi_monthly',
      status: 'pending_computation',
    });

    await period.save();
    console.log('✓ Created payroll period:', period._id);

    // Step 2: Get all employees (including HR Head, HR Staff who have salary configs)
    const employees = await User.find({ 
      role: { $in: ['employee', 'hr_staff', 'hr_head'] }
    }).lean();
    console.log(`✓ Found ${employees.length} users (HR Head, HR Staff, Employees)`);

    // Step 3: Get tax tables
    const taxTables = await GovernmentTaxTables.findOne().lean();
    if (!taxTables) {
      throw new Error('Tax tables not found');
    }
    console.log('✓ Retrieved tax tables');

    // Step 4: Compute payroll for each employee
    for (const employee of employees) {
      // Get attendance for this period
      const attendanceRecords = await Attendance.find({
        employee: employee._id,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      }).lean();

      const presentDays = attendanceRecords.length;
      console.log(`  Processing ${employee.firstName} ${employee.lastName}: ${presentDays} days`);

      if (presentDays === 0) {
        console.log(`    Skipping - no attendance records`);
        continue;
      }

      // Get salary config
      const salaryConfig = await EmployeeSalaryConfig.findOne({ employee: employee._id }).lean();
      if (!salaryConfig) {
        console.log(`    Skipping - no salary config`);
        continue;
      }

      const dailyRate = salaryConfig.dailyRate || 1363.64;
      const MEAL_ALLOWANCE = 200;

      // Calculate earnings
      const basicSalary = presentDays * dailyRate;
      const allowances = MEAL_ALLOWANCE;
      const grossPay = basicSalary + allowances;

      // Calculate deductions (these are fixed percentages based on salary)
      const sssContribution = 555;
      const philhealthContribution = 200;
      const pagibigContribution = 200;
      const withholdinTax = calculateWithholdinTax(grossPay, taxTables);

      const totalDeductions = sssContribution + philhealthContribution + pagibigContribution + withholdinTax;
      const netPay = grossPay - totalDeductions;

      // Create payroll record
      const record = new PayrollRecord({
        payrollPeriod: period._id,
        employee: employee._id,
        earnings: {
          basicSalary,
          overtimePay: 0,
          nightDifferential: 0,
          holidayPay: 0,
          allowances,
          grossPay,
        },
        deductions: {
          sssContribution,
          philhealthContribution,
          pagibigContribution,
          withholdinTax,
          totalDeductions,
        },
        netPay,
        status: 'computed',
        computedAt: new Date(),
      });

      await record.save();
      console.log(`    ✓ Computed: Gross ₱${grossPay.toLocaleString('en-PH', { maximumFractionDigits: 2 })}, Net ₱${netPay.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`);
    }

    // Step 5: Update period status to computation_completed
    period.status = 'computation_completed';
    await period.save();
    console.log('✓ Updated period status to computation_completed');

    // Step 6: Approve the period (simulate HR Head approval)
    period.status = 'approved';
    period.approvedBy = employees[0]._id; // Use first employee as placeholder
    period.approvedAt = new Date();
    await period.save();
    console.log('✓ Approved period');

    // Step 7: Lock the period
    period.status = 'locked';
    period.lockedAt = new Date();
    await period.save();
    console.log('✓ Locked period');

    // Step 8: Generate payslips
    const records = await PayrollRecord.find({ payrollPeriod: period._id }).lean();
    console.log(`\nGenerating ${records.length} payslips...`);

    for (const record of records) {
      const payslip = new Payslip({
        payrollRecord: record._id,
        payrollPeriod: period._id,
        employee: record.employee,
        earnings: record.earnings,
        deductions: record.deductions,
        netPay: record.netPay,
        status: 'generated',
        generatedAt: new Date(),
      });

      await payslip.save();
      console.log(`  ✓ Generated payslip for employee ${record.employee}`);
    }

    console.log('\n✅ Payroll initialization, computation, and payslip generation completed!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

computePayroll();
