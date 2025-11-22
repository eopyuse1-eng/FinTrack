/**
 * Generate Payslip History for All Employees
 * Creates payroll records and payslips for past payroll periods
 * Run: node generatePayslipHistory.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./models/User');
const PayrollPeriod = require('./models/PayrollPeriod');
const PayrollRecord = require('./models/PayrollRecord');
const Payslip = require('./models/Payslip');
const EmployeeSalaryConfig = require('./models/EmployeeSalaryConfig');

async function generatePayslipHistory() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Get all employees
    const employees = await User.find({ 
      role: { $in: ['employee', 'hr_staff'] },
      $or: [
        { department: 'marketing' },
        { department: 'treasury' }
      ]
    });

    console.log(`✓ Found ${employees.length} employees in marketing and treasury\n`);

    // Create or get payroll periods (past 3 months)
    const periods = [];
    for (let i = 3; i >= 1; i--) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - i);
      startDate.setDate(1);

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of month

      const periodName = startDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      let period = await PayrollPeriod.findOne({ periodName });
      if (!period) {
        period = new PayrollPeriod({
          periodName,
          startDate,
          endDate,
          paymentDate: new Date(endDate),
          status: 'approved',
        });
        await period.save();
        console.log(`✓ Created payroll period: ${periodName}`);
      }
      periods.push(period);
    }
    console.log();

    // Generate payroll records and payslips for each employee and period
    for (const employee of employees) {
      console.log(`📝 Generating payslips for ${employee.firstName} ${employee.lastName}...`);

      for (const period of periods) {
        // Check if payroll record already exists
        let payrollRecord = await PayrollRecord.findOne({
          employee: employee._id,
          payrollPeriod: period._id,
        });

        if (!payrollRecord) {
          // Create payroll record with realistic data
          const dailyRate = 1500; // Default daily rate
          const hourlyRate = dailyRate / 8;

          payrollRecord = new PayrollRecord({
            payrollPeriod: period._id,
            employee: employee._id,
            
            // Realistic attendance
            attendance: {
              workDaysInPeriod: 20,
              presentDays: 19,
              absenceDays: 1,
              tardinessMins: Math.floor(Math.random() * 120), // 0-120 minutes
              undertimeMins: 0,
              overtimeHours: Math.floor(Math.random() * 10), // 0-10 hours
              nightDifferentialHours: 0,
            },

            // Leaves
            leaves: {
              paidLeaveDays: 0,
              unpaidLeaveDays: 1,
              sickLeaveDays: 0,
              vacationLeaveDays: 0,
            },

            // Holiday pay
            holidayPay: {
              specialHolidayHours: 0,
              specialHolidayAmountWorked: 0,
              regularHolidayHours: 0,
              regularHolidayAmountWorked: 0,
            },
          });

          // Calculate earnings
          const presentDays = payrollRecord.attendance.presentDays;
          const basicSalary = dailyRate * presentDays;
          const overtimePay = payrollRecord.attendance.overtimeHours * hourlyRate * 1.25;
          const tardinessMins = payrollRecord.attendance.tardinessMins;
          const lateDeduction = (tardinessMins / 60) * hourlyRate;
          const absenceDeduction = dailyRate * payrollRecord.attendance.absenceDays;

          payrollRecord.earnings = {
            basicSalary: Math.round(basicSalary),
            overtimePay: Math.round(overtimePay),
            nightDifferentialPay: 0,
            holidayPay: 0,
            paidLeavePay: 0,
            allowances: 1000, // Monthly allowance
            bonusesReimbursements: 0,
            otherAdditions: 0,
            grossPay: Math.round(basicSalary + overtimePay + 1000),
          };

          // Calculate deductions (simplified SSS, PhilHealth, PagIBIG)
          const grossPay = payrollRecord.earnings.grossPay;
          const sssContribution = Math.round(grossPay * 0.045); // 4.5%
          const philhealthContribution = Math.round(grossPay * 0.025); // 2.5%
          const pagibigContribution = 100; // Fixed
          const withholdinTax = Math.round((grossPay * 0.12)); // Simplified 12%

          payrollRecord.deductions = {
            lateDeduction: Math.round(lateDeduction),
            undertimeDeduction: 0,
            absenceDeduction: Math.round(absenceDeduction),
            sssContribution,
            philhealthContribution,
            pagibigContribution,
            withholdinTax,
            loanDeductions: 0,
            otherDeductions: 0,
            totalDeductions: Math.round(
              lateDeduction + absenceDeduction + sssContribution + 
              philhealthContribution + pagibigContribution + withholdinTax
            ),
          };

          payrollRecord.netPay = Math.round(
            payrollRecord.earnings.grossPay - payrollRecord.deductions.totalDeductions
          );

          payrollRecord.status = 'approved';
          payrollRecord.approvedBy = employee._id;
          payrollRecord.approvedAt = period.endDate;

          await payrollRecord.save();
        }

        // Check if payslip already exists
        let payslip = await Payslip.findOne({
          payrollRecord: payrollRecord._id,
        });

        if (!payslip) {
          payslip = new Payslip({
            payrollRecord: payrollRecord._id,
            payrollPeriod: period._id,
            employee: employee._id,

            employeeDetails: {
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              position: 'Staff',
              department: employee.department,
              employmentStatus: employee.employmentStatus || 'Regular',
              sssNumber: 'XX-XXXXX-X',
              philhealthNumber: 'XX-XXXXXXXXX-X',
              pagibigNumber: 'XXXXXXXXX',
              tinNumber: 'XXX-XXXXXX-XXX',
            },

            periodInfo: {
              periodName: period.periodName,
              startDate: period.startDate,
              endDate: period.endDate,
              paymentDate: period.paymentDate,
              paymentMethod: 'Bank Transfer',
            },

            computationSummary: {
              workDays: payrollRecord.attendance.workDaysInPeriod,
              presentDays: payrollRecord.attendance.presentDays,
              absenceDays: payrollRecord.attendance.absenceDays,
              paidLeaveDays: payrollRecord.leaves.paidLeaveDays,
              unpaidLeaveDays: payrollRecord.leaves.unpaidLeaveDays,
            },

            earnings: payrollRecord.earnings,
            deductions: payrollRecord.deductions,
            netPay: payrollRecord.netPay,

            paymentInfo: {
              bankName: 'Metrobank',
              accountNumber: 'XXXX-XXXX-XXXX-' + Math.random().toString().slice(2, 6),
              accountName: `${employee.firstName} ${employee.lastName}`,
            },

            approvedBy: {
              name: 'Maria Santos',
              position: 'HR Head',
              signature: 'Maria Santos',
              approvalDate: period.endDate,
            },

            status: 'generated',
            pdfGenerated: false,
          });

          await payslip.save();
        }
      }

      console.log(`   ✓ Generated 3 payslips\n`);
    }

    console.log('✅ Payslip history generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generatePayslipHistory();
