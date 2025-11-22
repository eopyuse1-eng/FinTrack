const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollRecord = require('../models/PayrollRecord');
const Payslip = require('../models/Payslip');
const EmployeeSalaryConfig = require('../models/EmployeeSalaryConfig');
const { User } = require('../models/User');
const { Attendance } = require('../models/Attendance');
const { Leave } = require('../models/Leave');
const GovernmentTaxTables = require('../models/GovernmentTaxTables');
const { AuditLog } = require('../models/AuditLog');

/**
 * GET ALL PAYROLL PERIODS
 * GET /api/payroll
 */
exports.getPayrollPeriods = async (req, res) => {
  try {
    const periods = await PayrollPeriod.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: periods,
    });
  } catch (error) {
    console.error('Get payroll periods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll periods',
      error: error.message,
    });
  }
};

/**
 * ============================================================================
 * PAYROLL CONTROLLER - Complete Salary Automation & Payroll Processing
 * ============================================================================
 *
 * Core Functions:
 * 1. initializePayroll - Create payroll period and initialize payroll records
 * 2. computePayroll - Compute salary for individual employee
 * 3. approvePayroll - HR Head approval
 * 4. rejectPayroll - Send back for recomputation
 * 5. lockPayroll - Finalize payroll period
 * 6. generatePayslips - Create payslips from payroll records
 * 7. getPayslip - Employee views payslip
 * 8. exportPayslipPDF - Generate PDF
 */

/**
 * ============================================================================
 * HELPER FUNCTIONS - Payroll Computation Logic
 * ============================================================================
 */

/**
 * HELPER 1: Get contribution amounts based on salary
 * Looks up employee's contribution in government tables
 */
const getGovernmentContribution = (baseSalary, contributionType, tables) => {
  let contributions = [];

  if (contributionType === 'sss') {
    contributions = tables.sssContributions;
  } else if (contributionType === 'philhealth') {
    contributions = tables.philhealthContributions;
  } else if (contributionType === 'pagibig') {
    contributions = tables.pagibigContributions;
  }

  // Find the bracket that matches the salary
  const bracket = contributions.find(
    (c) => baseSalary >= c.salaryRange.min && baseSalary <= c.salaryRange.max
  );

  return bracket ? bracket.monthlyContribution : 0;
};

/**
 * HELPER 2: Calculate Withholding Tax based on BIR TRAIN Law
 * Formula: Tax = (Taxable Income - Min of Bracket) * Tax Rate - Fixed Deduction + Previous Tax
 * @param {number} taxableIncome - Gross pay or taxable income
 * @param {array} taxBrackets - Tax bracket data from GovernmentTaxTables
 * @param {boolean} isTaxExempt - If true, return 0 (no tax)
 */
const calculateWithholdinTax = (taxableIncome, taxBrackets, isTaxExempt = false) => {
  try {
    // If employee is tax-exempt, return 0
    if (isTaxExempt) {
      console.log(`  ✓ Tax EXEMPT - No withholding tax deducted`);
      return 0;
    }

    if (!taxBrackets || !Array.isArray(taxBrackets) || taxBrackets.length === 0) {
      console.warn('⚠️ Invalid tax brackets:', taxBrackets);
      return 0;
    }

    // Find matching bracket
    const bracket = taxBrackets.find(
      (b) => taxableIncome > b.incomeRange.min && taxableIncome <= b.incomeRange.max
    );

    if (!bracket) {
      console.warn(`⚠️ No bracket found for income: ${taxableIncome}`);
      return 0;
    }

    // BIR TRAIN Formula: [(Income - Min Range) * Tax Rate] - Fixed Deduction
    const taxAmount = Math.max(0, (taxableIncome - bracket.incomeRange.min) * (bracket.taxRate / 100) + bracket.fixedTaxAmount);

    return taxAmount;
  } catch (error) {
    console.error('Error calculating withholding tax:', error.message);
    return 0;
  }
};

/**
 * HELPER 3: Get attendance data for payroll period
 */
const getAttendanceData = async (employeeId, periodStartDate, periodEndDate) => {
  try {
    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: periodStartDate,
        $lte: periodEndDate,
      },
    });

    let workDaysInPeriod = 0;
    let presentDays = 0;
    let tardinessMins = 0;
    let undertimeMins = 0;
    let overtimeHours = 0;
    let nightDifferentialHours = 0;

    for (const record of attendanceRecords) {
      // Count work days (Mon-Sat, day 1-6)
      const dayOfWeek = record.date.getDay();
      if (dayOfWeek !== 0) {
        // Sunday = 0, exclude it
        workDaysInPeriod++;

        // If employee checked in/out, count as present
        if (record.checkInTime && record.checkOutTime) {
          presentDays++;

          // Calculate tardiness
          if (record.late) {
            tardinessMins += record.late; // Assuming 'late' is in minutes
          }

          // Calculate undertime
          if (record.undertime) {
            undertimeMins += record.undertime; // in minutes
          }

          // Calculate overtime
          if (record.overtimeHours) {
            overtimeHours += record.overtimeHours;
          }

          // Calculate night differential (10 PM - 6 AM)
          if (record.nightDifferentialHours) {
            nightDifferentialHours += record.nightDifferentialHours;
          }
        }
      }
    }

    return {
      workDaysInPeriod,
      presentDays,
      absenceDays: workDaysInPeriod - presentDays,
      tardinessMins,
      undertimeMins,
      overtimeHours,
      nightDifferentialHours,
    };
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return {
      workDaysInPeriod: 0,
      presentDays: 0,
      absenceDays: 0,
      tardinessMins: 0,
      undertimeMins: 0,
      overtimeHours: 0,
      nightDifferentialHours: 0,
    };
  }
};

/**
 * HELPER 4: Get leave data for payroll period
 */
const getLeaveData = async (employeeId, periodStartDate, periodEndDate) => {
  try {
    const leaveRecords = await Leave.find({
      submittedBy: employeeId,
      status: 'approved',
      startDate: { $lte: periodEndDate },
      endDate: { $gte: periodStartDate },
    });

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let sickLeaveDays = 0;
    let vacationLeaveDays = 0;

    for (const leave of leaveRecords) {
      if (leave.leaveType === 'sick_leave') {
        sickLeaveDays += leave.numberOfDays;
        paidLeaveDays += leave.numberOfDays; // Sick leave is paid
      } else if (leave.leaveType === 'vacation') {
        vacationLeaveDays += leave.numberOfDays;
        paidLeaveDays += leave.numberOfDays;
      } else if (leave.leaveType === 'unpaid_leave') {
        unpaidLeaveDays += leave.numberOfDays;
      }
    }

    return {
      paidLeaveDays,
      unpaidLeaveDays,
      sickLeaveDays,
      vacationLeaveDays,
    };
  } catch (error) {
    console.error('Error fetching leave data:', error);
    return {
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      sickLeaveDays: 0,
      vacationLeaveDays: 0,
    };
  }
};

/**
 * HELPER 5: Get holiday pay data
 */
const getHolidayPayData = async (specialDays, employeeId, periodStartDate, periodEndDate) => {
  // For now, simplified - in real implementation, check if employee worked on holiday
  let specialHolidayHours = 0;
  let specialHolidayAmountWorked = 0;
  let regularHolidayHours = 0;
  let regularHolidayAmountWorked = 0;

  // Count holidays in period
  for (const holiday of specialDays) {
    if (holiday.date >= periodStartDate && holiday.date <= periodEndDate) {
      // Check if employee has attendance record on holiday
      const holidayAttendance = await Attendance.findOne({
        employee: employeeId,
        date: {
          $gte: new Date(holiday.date.setHours(0, 0, 0, 0)),
          $lte: new Date(holiday.date.setHours(23, 59, 59, 999)),
        },
      });

      if (holidayAttendance && holidayAttendance.checkInTime) {
        if (holiday.dayType === 'special_holiday') {
          specialHolidayHours += 8; // Assuming 8-hour workday
        } else if (holiday.dayType === 'regular_holiday') {
          regularHolidayHours += 8;
        }
      }
    }
  }

  return {
    specialHolidayHours,
    specialHolidayAmountWorked,
    regularHolidayHours,
    regularHolidayAmountWorked,
  };
};

/**
 * ============================================================================
 * MAIN CONTROLLER FUNCTIONS
 * ============================================================================
 */

/**
 * 1. INITIALIZE PAYROLL PERIOD
 * POST /api/payroll/initialize
 * 
 * Creates a new payroll period and initializes payroll records for all active employees
 * HR Staff only
 */
exports.initializePayroll = async (req, res) => {
  try {
    const { periodName, payrollCycle, startDate, endDate, attendanceCutoffStart, attendanceCutoffEnd, specialDays } = req.body;

    // Validation
    if (!periodName || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: periodName, startDate, endDate',
      });
    }

    // Check if payroll period already exists for this date range
    const existingPeriod = await PayrollPeriod.findOne({
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
      status: { $ne: 'cancelled' },
    });

    if (existingPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Overlapping payroll period already exists',
      });
    }

    // Create payroll period
    const newPeriod = new PayrollPeriod({
      periodName,
      payrollCycle: payrollCycle || 'monthly',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      attendanceCutoffStart: attendanceCutoffStart ? new Date(attendanceCutoffStart) : new Date(startDate),
      attendanceCutoffEnd: attendanceCutoffEnd ? new Date(attendanceCutoffEnd) : new Date(endDate),
      specialDays: specialDays || [],
      status: 'pending_computation',
      createdBy: req.user?.id || req.user?._id,
    });

    await newPeriod.save();

    // Get all active employees with salary config
    const employees = await User.find({
      isActive: true,
      role: { $in: ['employee', 'marketing_staff', 'treasury_staff'] },
    });

    // Initialize payroll records for each employee
    let createdRecords = 0;
    for (const employee of employees) {
      const salaryConfig = await EmployeeSalaryConfig.findOne({ employee: employee._id });

      if (salaryConfig) {
        const existingRecord = await PayrollRecord.findOne({
          payrollPeriod: newPeriod._id,
          employee: employee._id,
        });

        if (!existingRecord) {
          const record = new PayrollRecord({
            payrollPeriod: newPeriod._id,
            employee: employee._id,
            salaryConfig: salaryConfig._id,
            status: 'draft',
          });
          await record.save();
          createdRecords++;
        }
      }
    }

    newPeriod.totalEmployeesInPayroll = createdRecords;
    await newPeriod.save();

    // Check if no employee records were created
    if (createdRecords === 0) {
      return res.status(400).json({
        success: false,
        message: `No employee data found for payroll period (${periodName}). No employees have salary configurations set up for this period. Please configure employee salaries before initializing payroll.`,
        code: 'NO_EMPLOYEE_DATA',
        data: newPeriod,
      });
    }

    // Check if there's attendance data for this period
    const attendanceCount = await Attendance.countDocuments({
      date: {
        $gte: newPeriod.attendanceCutoffStart,
        $lte: newPeriod.attendanceCutoffEnd,
      },
    });

    let warningMessage = '';
    if (attendanceCount === 0) {
      warningMessage = `⚠️ WARNING: No attendance records found for this period (${newPeriod.attendanceCutoffStart.toLocaleDateString()} - ${newPeriod.attendanceCutoffEnd.toLocaleDateString()}). Payroll will be computed using full working days assumption.`;
      console.log(warningMessage);
    }

    res.status(201).json({
      success: true,
      message: `Payroll period created with ${createdRecords} employee records${warningMessage ? '. ' + warningMessage : ''}`,
      warning: warningMessage || null,
      data: newPeriod,
    });
  } catch (error) {
    console.error('Initialize payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing payroll',
      error: error.message,
    });
  }
};

/**
 * COMPUTE ALL PAYROLL FOR PERIOD
 * POST /api/payroll/:payrollPeriodId/compute-all
 * 
 * Computes payroll for all employees in a period
 * HR Staff only
 */
exports.computeAllPayroll = async (req, res) => {
  try {
    const { payrollPeriodId } = req.params;

    console.log('=== COMPUTE ALL PAYROLL START ===');
    console.log('Payroll Period ID:', payrollPeriodId);

    const payrollPeriod = await PayrollPeriod.findById(payrollPeriodId);
    if (!payrollPeriod) {
      return res.status(404).json({ success: false, message: 'Payroll period not found' });
    }

    console.log('Payroll Period:', payrollPeriod.periodName);
    console.log('Attendance Cutoff:', payrollPeriod.attendanceCutoffStart, 'to', payrollPeriod.attendanceCutoffEnd);

    const payrollRecords = await PayrollRecord.find({ payrollPeriod: payrollPeriodId });
    console.log('Found PayrollRecords:', payrollRecords.length);

    // Check if there are no payroll records
    if (!payrollRecords || payrollRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No employee data found for the payroll period (${payrollPeriod.periodName}). Please initialize payroll first before computing.`,
        code: 'NO_PAYROLL_RECORDS'
      });
    }

    // Try multiple ways to fetch tax tables
    let taxTables = await GovernmentTaxTables.findOne();
    console.log('Tax Tables Query Result:', taxTables ? 'Found' : 'NOT FOUND');
    
    if (!taxTables) {
      console.log('Attempting to find any tax table...');
      taxTables = await GovernmentTaxTables.find().limit(1);
      if (taxTables && taxTables.length > 0) {
        taxTables = taxTables[0];
        console.log('Found via find():', taxTables._id);
      }
    }

    if (!taxTables) {
      console.log('ERROR: No tax tables found in database!');
      return res.status(400).json({ 
        success: false, 
        message: 'Tax tables not configured. Please contact your system administrator to initialize tax tables.',
        code: 'TAX_TABLES_MISSING'
      });
    }

    console.log('Tax Tables ID:', taxTables._id);
    console.log('Withholding Tax Brackets count:', taxTables.withholdingTaxBrackets ? taxTables.withholdingTaxBrackets.length : 'UNDEFINED');

    if (!taxTables.withholdingTaxBrackets || taxTables.withholdingTaxBrackets.length === 0) {
      console.log('ERROR: withholdinTaxBrackets is missing or empty!');
      console.log('Available fields:', Object.keys(taxTables));
      return res.status(400).json({ 
        success: false, 
        message: 'Withholding tax brackets not configured. Please contact your system administrator.',
        code: 'TAX_BRACKETS_MISSING'
      });
    }

    let computedCount = 0;
    const results = [];

    for (const record of payrollRecords) {
      try {
        console.log(`\n--- Processing Employee ID: ${record.employee} ---`);
        const salaryConfig = await EmployeeSalaryConfig.findOne({ employee: record.employee });
        if (!salaryConfig) {
          console.log('  ⚠️ No salary config found - attempting to use monthly salary from record');
          // Use default salary if configured in record or skip
          if (!record.baseSalary || record.baseSalary === 0) {
            console.log('  ⚠️ No salary information available - skipping');
            continue;
          }
        }

        const dailyRateFromConfig = salaryConfig?.dailyRate || (salaryConfig?.monthlySalary || record.baseSalary || 0) / 22;
        console.log('  Daily Rate:', dailyRateFromConfig);

        const employeeId = record.employee;
        const attendanceData = await getAttendanceData(employeeId, payrollPeriod.attendanceCutoffStart, payrollPeriod.attendanceCutoffEnd);
        const leaveData = await getLeaveData(employeeId, payrollPeriod.startDate, payrollPeriod.endDate);
        const holidayData = await getHolidayPayData(payrollPeriod.specialDays || [], employeeId, payrollPeriod.startDate, payrollPeriod.endDate);

        console.log('  Attendance - Present Days:', attendanceData.presentDays);
        console.log('  Leave Data:', leaveData);
        console.log('  Holiday Data:', holidayData);

        record.attendance = attendanceData;
        record.leaves = leaveData;
        record.holidayPay = holidayData;

        // Calculate earnings - if no attendance records, calculate based on days in period
        let presentDays = attendanceData.presentDays || 0;
        
        // If no attendance data exists, assume full month worked (22 working days)
        if (presentDays === 0 && attendanceData.workDaysInPeriod === 0) {
          // Calculate number of working days in the period (excluding Sundays)
          let workDays = 0;
          let currentDate = new Date(payrollPeriod.startDate);
          while (currentDate <= payrollPeriod.endDate) {
            if (currentDate.getDay() !== 0) { // Not Sunday
              workDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
          presentDays = Math.max(workDays, 1); // At least 1 day
          console.log('  No attendance records found - Using default working days:', presentDays);
        }
        const hourlyRate = salaryConfig?.hourlyRate || dailyRateFromConfig / 9; // Assuming 9-hour workday
        const basicPay = dailyRateFromConfig * presentDays;

        // Calculate OT and night differential pay
        const overtimePay = (attendanceData.overtimeHours || 0) * hourlyRate * (salaryConfig?.overtimeRate || 1.25);
        const nightDiffPay = (attendanceData.nightDifferentialHours || 0) * hourlyRate * (salaryConfig?.nightDifferentialRate || 1.10);

        // Sum allowances from array
        const totalAllowances = (salaryConfig?.allowances || []).reduce((sum, allowance) => sum + (allowance.amount || 0), 0);

        record.earnings = {
          basicSalary: basicPay,
          overtimePay: overtimePay,
          nightDifferential: nightDiffPay,
          holidayPay: holidayData.totalHolidayPay || 0,
          allowances: totalAllowances,
          grossPay: basicPay + overtimePay + nightDiffPay + (holidayData.totalHolidayPay || 0) + totalAllowances,
        };

        console.log('  Gross Pay:', record.earnings.grossPay);

        const sssContrib = getGovernmentContribution(record.earnings.grossPay, 'sss', taxTables);
        const philhealthContrib = getGovernmentContribution(record.earnings.grossPay, 'philhealth', taxTables);
        const pagibigContrib = getGovernmentContribution(record.earnings.grossPay, 'pagibig', taxTables);
        
        console.log('  Tax Tables withholdingTaxBrackets:', taxTables.withholdingTaxBrackets ? taxTables.withholdingTaxBrackets.length : 'undefined');
        const withholdinTax = calculateWithholdinTax(record.earnings.grossPay, taxTables.withholdingTaxBrackets, salaryConfig.isTaxExempt);

        record.deductions = {
          sssContribution: sssContrib,
          philhealthContribution: philhealthContrib,
          pagibigContribution: pagibigContrib,
          withholdinTax: withholdinTax,
          totalDeductions: sssContrib + philhealthContrib + pagibigContrib + withholdinTax,
        };

        console.log('  Total Deductions:', record.deductions.totalDeductions);

        record.netPay = record.earnings.grossPay - record.deductions.totalDeductions;
        record.status = 'computed';
        record.computedAt = new Date();

        console.log('  Net Pay:', record.netPay);
        console.log('  ✅ Saved');

        await record.save();
        computedCount++;
        results.push(record);
      } catch (err) {
        console.error(`Error computing payroll for employee ${record.employee}:`, err.message);
        console.error(err.stack);
      }
    }

    console.log('\n=== COMPUTE COMPLETE ===');
    console.log('Total Computed:', computedCount);

    // Calculate totals
    const totalGrossPay = results.reduce((sum, r) => sum + (r.earnings?.grossPay || 0), 0);
    const totalDeductions = results.reduce((sum, r) => sum + (r.deductions?.totalDeductions || 0), 0);
    const totalNetPay = results.reduce((sum, r) => sum + (r.netPay || 0), 0);

    // Update payroll period status to computation_completed
    payrollPeriod.status = 'computation_completed';
    payrollPeriod.totalRecordsComputed = computedCount;
    payrollPeriod.totalGrossPay = totalGrossPay;
    payrollPeriod.totalDeductions = totalDeductions;
    payrollPeriod.totalNetPay = totalNetPay;
    payrollPeriod.computedAt = new Date();
    await payrollPeriod.save();

    console.log(`✓ PayrollPeriod status updated to: ${payrollPeriod.status}`);

    res.status(200).json({
      success: true,
      data: {
        payrollPeriod: payrollPeriod.toObject(),
        computedCount,
        records: results,
      },
    });
  } catch (error) {
    console.error('Compute all payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error computing payroll',
      error: error.message,
    });
  }
};

/**
 * 2. COMPUTE PAYROLL FOR SINGLE EMPLOYEE
 * PUT /api/payroll/:payrollPeriodId/:employeeId/compute
 * 
 * Full salary computation with all deductions and additions
 * HR Staff only
 */
exports.computePayroll = async (req, res) => {
  try {
    const { payrollPeriodId, employeeId } = req.params;
    const { computationNotes, adjustments } = req.body;

    // Fetch necessary data
    const payrollRecord = await PayrollRecord.findOne({
      payrollPeriod: payrollPeriodId,
      employee: employeeId,
    });

    if (!payrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    if (payrollRecord.isLocked()) {
      return res.status(400).json({
        success: false,
        message: 'This payroll record is locked and cannot be modified',
      });
    }

    const payrollPeriod = await PayrollPeriod.findById(payrollPeriodId);
    const salaryConfig = await EmployeeSalaryConfig.findById(payrollRecord.salaryConfig);
    const taxTables = await GovernmentTaxTables.findOne();

    if (!salaryConfig || !taxTables) {
      return res.status(400).json({
        success: false,
        message: 'Missing salary configuration or tax tables',
      });
    }

    // ========== STEP 1: GET ATTENDANCE DATA ==========
    const attendanceData = await getAttendanceData(employeeId, payrollPeriod.attendanceCutoffStart, payrollPeriod.attendanceCutoffEnd);
    payrollRecord.attendance = attendanceData;

    // ========== STEP 2: GET LEAVE DATA ==========
    const leaveData = await getLeaveData(employeeId, payrollPeriod.startDate, payrollPeriod.endDate);
    payrollRecord.leaves = leaveData;

    // ========== STEP 3: GET HOLIDAY PAY DATA ==========
    const holidayData = await getHolidayPayData(payrollPeriod.specialDays, employeeId, payrollPeriod.startDate, payrollPeriod.endDate);
    payrollRecord.holidayPay = holidayData;

    // ========== STEP 4: CALCULATE EARNINGS ==========

    // Basic Salary: Daily Rate * Present Days
    payrollRecord.earnings.basicSalary = (salaryConfig.dailyRate || salaryConfig.monthlyRate / 26) * attendanceData.presentDays;

    // Overtime Pay: OT Hours * Hourly Rate * 1.25
    payrollRecord.earnings.overtimePay = attendanceData.overtimeHours * salaryConfig.hourlyRate * salaryConfig.overtimeRate;

    // Night Differential: ND Hours * Hourly Rate * 1.10
    payrollRecord.earnings.nightDifferentialPay = attendanceData.nightDifferentialHours * salaryConfig.hourlyRate * salaryConfig.nightDifferentialRate;

    // Holiday Pay
    payrollRecord.earnings.holidayPay = holidayData.specialHolidayHours * salaryConfig.hourlyRate * salaryConfig.specialHolidayRate + 
                                        holidayData.regularHolidayHours * salaryConfig.hourlyRate * salaryConfig.regularHolidayRate;

    // Paid Leave Pay: Paid Leave Days * Daily Rate
    const dailyRate = salaryConfig.dailyRate || salaryConfig.monthlyRate / 26;
    payrollRecord.earnings.paidLeavePay = leaveData.paidLeaveDays * dailyRate;

    // Allowances: Sum from salary config
    payrollRecord.earnings.allowances = salaryConfig.getTotalAllowances();

    // Add manual adjustments (bonuses, reimbursements)
    if (adjustments && Array.isArray(adjustments)) {
      for (const adj of adjustments) {
        if (adj.type === 'bonus' || adj.type === 'reimbursement') {
          payrollRecord.adjustments.push(adj);
          payrollRecord.earnings.bonusesReimbursements += adj.amount;
        } else if (adj.type === 'deduction') {
          payrollRecord.deductions.otherDeductions += adj.amount;
        }
      }
    }

    // Calculate Gross Pay
    payrollRecord.calculateGrossPay();

    // ========== STEP 5: CALCULATE DEDUCTIONS ==========

    // Tardiness Deduction: (Late Minutes / 60) * Hourly Rate
    payrollRecord.deductions.lateDeduction = (attendanceData.tardinessMins / 60) * salaryConfig.hourlyRate;

    // Undertime Deduction: (UT Minutes / 60) * Hourly Rate
    payrollRecord.deductions.undertimeDeduction = (attendanceData.undertimeMins / 60) * salaryConfig.hourlyRate;

    // Absence Deduction: Daily Rate * Absence Days
    payrollRecord.deductions.absenceDeduction = dailyRate * attendanceData.absenceDays;

    // Government Contributions (based on Gross Pay)
    payrollRecord.deductions.sssContribution = getGovernmentContribution(payrollRecord.earnings.grossPay, 'sss', taxTables);
    payrollRecord.deductions.philhealthContribution = getGovernmentContribution(payrollRecord.earnings.grossPay, 'philhealth', taxTables);
    payrollRecord.deductions.pagibigContribution = getGovernmentContribution(payrollRecord.earnings.grossPay, 'pagibig', taxTables);

    // ========== STEP 6: CALCULATE WITHHOLDING TAX ==========
    // Taxable Income = Gross Pay - Government Contributions
    const taxableIncome = payrollRecord.earnings.grossPay - (payrollRecord.deductions.sssContribution + payrollRecord.deductions.philhealthContribution + payrollRecord.deductions.pagibigContribution);
    payrollRecord.taxCalculation.taxableIncome = taxableIncome;

    // Find applicable tax bracket
    const taxBracket = taxTables.withholdinTaxBrackets.find(
      (b) => taxableIncome > b.incomeRange.min && taxableIncome <= b.incomeRange.max
    );

    if (taxBracket) {
      payrollRecord.taxCalculation.taxRate = taxBracket.taxRate;
      payrollRecord.taxCalculation.fixedTaxAmount = taxBracket.fixedTaxAmount;
      
      // BIR TRAIN Formula: [(Taxable Income - Min Range) * Tax Rate %] + Fixed Deduction
      payrollRecord.deductions.withholdinTax = Math.max(0, (taxableIncome - taxBracket.incomeRange.min) * (taxBracket.taxRate / 100) + taxBracket.fixedTaxAmount);
    }

    // Add other deductions (loans, existing deductions)
    payrollRecord.deductions.loanDeductions = salaryConfig.getTotalDeductions();

    // Calculate total deductions and net pay
    payrollRecord.calculateTotalDeductions();
    payrollRecord.calculateNetPay();

    // Mark as computed
    payrollRecord.status = 'computed';
    payrollRecord.computedBy = req.user.id;
    payrollRecord.computedAt = new Date();
    payrollRecord.computationNotes = computationNotes;

    await payrollRecord.save();

    res.status(200).json({
      success: true,
      message: 'Payroll computed successfully',
      data: payrollRecord,
    });
  } catch (error) {
    console.error('Compute payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error computing payroll',
      error: error.message,
    });
  }
};

/**
 * 3. GET ALL PAYROLL RECORDS FOR PERIOD (for HR Head approval view)
 * GET /api/payroll/:payrollPeriodId
 */
exports.getPayrollPeriodRecords = async (req, res) => {
  try {
    const { payrollPeriodId } = req.params;
    const { status, search } = req.query;

    let query = { payrollPeriod: payrollPeriodId };

    if (status) {
      query.status = status;
    }

    if (search) {
      // Search by employee name or ID
      const employees = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      });

      const employeeIds = employees.map((e) => e._id);
      query.employee = { $in: employeeIds };
    }

    const records = await PayrollRecord.find(query)
      .populate('employee', 'firstName lastName email position')
      .populate('payrollPeriod', 'periodName status');

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Get payroll records error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll records',
      error: error.message,
    });
  }
};

/**
 * 4. APPROVE PAYROLL RECORD (HR Head only)
 * PUT /api/payroll/:payrollRecordId/approve
 */
exports.approvePayrollRecord = async (req, res) => {
  try {
    const { payrollRecordId } = req.params;
    const { approvalNotes } = req.body;

    const payrollRecord = await PayrollRecord.findById(payrollRecordId);

    if (!payrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    if (payrollRecord.status === 'approved' || payrollRecord.status === 'locked') {
      return res.status(400).json({
        success: false,
        message: 'This record is already approved/locked',
      });
    }

    payrollRecord.status = 'approved';
    payrollRecord.approvedBy = req.user.id;
    payrollRecord.approvedAt = new Date();
    payrollRecord.approvalNotes = approvalNotes;

    await payrollRecord.save();

    res.status(200).json({
      success: true,
      message: 'Payroll record approved',
      data: payrollRecord,
    });
  } catch (error) {
    console.error('Approve payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving payroll',
      error: error.message,
    });
  }
};

/**
 * 5. REJECT PAYROLL RECORD (HR Head sends back for recomputation)
 * PUT /api/payroll/:payrollRecordId/reject
 */
exports.rejectPayrollRecord = async (req, res) => {
  try {
    const { payrollRecordId } = req.params;
    const { rejectionReason } = req.body;

    const payrollRecord = await PayrollRecord.findById(payrollRecordId);

    if (!payrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    payrollRecord.status = 'draft';
    payrollRecord.rejectionReason = rejectionReason;
    payrollRecord.approvedBy = null;
    payrollRecord.approvedAt = null;

    await payrollRecord.save();

    res.status(200).json({
      success: true,
      message: 'Payroll record rejected and sent back for recomputation',
      data: payrollRecord,
    });
  } catch (error) {
    console.error('Reject payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting payroll',
      error: error.message,
    });
  }
};

/**
 * 6. LOCK PAYROLL PERIOD (final, no more changes)
 * PUT /api/payroll/:payrollPeriodId/lock
 * HR Head only
 */
exports.lockPayrollPeriod = async (req, res) => {
  try {
    const { payrollPeriodId } = req.params;

    const payrollPeriod = await PayrollPeriod.findById(payrollPeriodId);

    if (!payrollPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found',
      });
    }

    // Check if all records are approved
    const unapprovedRecords = await PayrollRecord.countDocuments({
      payrollPeriod: payrollPeriodId,
      status: { $ne: 'approved' },
    });

    if (unapprovedRecords > 0) {
      return res.status(400).json({
        success: false,
        message: `${unapprovedRecords} payroll records are not yet approved`,
      });
    }

    // Lock all records
    await PayrollRecord.updateMany(
      { payrollPeriod: payrollPeriodId },
      { status: 'locked' }
    );

    // Lock period
    payrollPeriod.status = 'locked';
    payrollPeriod.lockedBy = req.user.id;
    payrollPeriod.lockedAt = new Date();

    await payrollPeriod.save();

    res.status(200).json({
      success: true,
      message: 'Payroll period locked successfully',
      data: payrollPeriod,
    });
  } catch (error) {
    console.error('Lock payroll period error:', error);
    res.status(500).json({
      success: false,
      message: 'Error locking payroll period',
      error: error.message,
    });
  }
};

/**
 * 7. GENERATE PAYSLIPS (from locked/approved payroll records)
 * POST /api/payroll/:payrollPeriodId/generate-payslips
 * HR Head only
 */
exports.generatePayslips = async (req, res) => {
  try {
    const { payrollPeriodId } = req.params;

    const payrollPeriod = await PayrollPeriod.findById(payrollPeriodId);
    if (!payrollPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found',
      });
    }

    const payrollRecords = await PayrollRecord.find({
      payrollPeriod: payrollPeriodId,
      status: 'approved',
    }).populate('employee');

    let generatedCount = 0;

    for (const record of payrollRecords) {
      // Check if payslip already exists
      const existingPayslip = await Payslip.findOne({ payrollRecord: record._id });

      if (!existingPayslip) {
        const payslip = new Payslip({
          payrollRecord: record._id,
          payrollPeriod: payrollPeriodId,
          employee: record.employee._id,
          employeeDetails: {
            firstName: record.employee.firstName,
            lastName: record.employee.lastName,
            email: record.employee.email,
            position: record.employee.position,
            department: record.employee.department,
          },
          periodInfo: {
            periodName: payrollPeriod.periodName,
            startDate: payrollPeriod.startDate,
            endDate: payrollPeriod.endDate,
          },
          computationSummary: record.attendance,
          earnings: record.earnings,
          deductions: record.deductions,
          netPay: record.netPay,
          status: 'generated',
        });

        await payslip.save();
        generatedCount++;
      }
    }

    // Update period status
    payrollPeriod.status = 'payroll_run';
    payrollPeriod.payrollRunBy = req.user.id;
    payrollPeriod.payrollRunAt = new Date();
    await payrollPeriod.save();

    res.status(201).json({
      success: true,
      message: `${generatedCount} payslips generated successfully`,
      data: { generatedCount },
    });
  } catch (error) {
    console.error('Generate payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating payslips',
      error: error.message,
    });
  }
};

/**
 * 8. GET EMPLOYEE'S PAYSLIPS
 * GET /api/payroll/payslips/me
 * Employee can view their own payslips
 */
exports.getMyPayslips = async (req, res) => {
  try {
    console.log(`\n=== getMyPayslips called for user: ${req.user.id} ===`);
    
    const payslips = await Payslip.find({ employee: req.user.id })
      .populate('payrollPeriod', 'periodName startDate endDate')
      .sort({ 'periodInfo.endDate': -1 });

    console.log(`Found ${payslips.length} payslips for employee ${req.user.id}`);
    if (payslips.length > 0) {
      console.log('Payslip periods:', payslips.map(p => p.periodInfo?.periodName));
    }

    res.status(200).json({
      success: true,
      data: payslips,
    });
  } catch (error) {
    console.error('Get payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payslips',
      error: error.message,
    });
  }
};

/**
 * 9. VIEW SINGLE PAYSLIP
 * GET /api/payroll/payslips/:payslipId
 * Employee views their payslip (marks as viewed)
 */
exports.getPayslip = async (req, res) => {
  try {
    const { payslipId } = req.params;

    const payslip = await Payslip.findById(payslipId).populate('employee', 'firstName lastName email');

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found',
      });
    }

    // Check authorization (employee can only view own payslip)
    if (payslip.employee._id.toString() !== req.user.id && req.user.role !== 'hr_head' && req.user.role !== 'hr_staff') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this payslip',
      });
    }

    // Mark as viewed
    payslip.markAsViewed(req.user.id);
    await payslip.save();

    res.status(200).json({
      success: true,
      data: payslip,
    });
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payslip',
      error: error.message,
    });
  }
};

/**
 * 10. EXPORT PAYSLIP AS PDF
 * GET /api/payroll/payslips/:payslipId/pdf
 * 
 * NOTE: Requires pdfkit or puppeteer library
 * For now, returns payslip data that can be used to generate PDF on frontend
 */
exports.exportPayslipPDF = async (req, res) => {
  try {
    const { payslipId } = req.params;

    const payslip = await Payslip.findById(payslipId);

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found',
      });
    }

    // Check authorization
    if (payslip.employee.toString() !== req.user.id && req.user.role !== 'hr_head' && req.user.role !== 'hr_staff') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to download this payslip',
      });
    }

    // Mark as downloaded
    payslip.markAsDownloaded(req.user.id);
    await payslip.save();

    // Return payslip data (frontend will generate PDF using jsPDF or similar)
    res.status(200).json({
      success: true,
      message: 'Payslip data ready for PDF export',
      data: payslip,
    });
  } catch (error) {
    console.error('Export payslip PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting payslip',
      error: error.message,
    });
  }
};

/**
 * 11. GET PAYROLL SUMMARY FOR PERIOD
 * GET /api/payroll/:payrollPeriodId/summary
 * Dashboard summary view
 */
exports.getPayrollSummary = async (req, res) => {
  try {
    const { payrollPeriodId } = req.params;

    const payrollPeriod = await PayrollPeriod.findById(payrollPeriodId);

    if (!payrollPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found',
      });
    }

    const records = await PayrollRecord.find({ payrollPeriod: payrollPeriodId });

    // Calculate totals
    const summary = {
      totalEmployees: records.length,
      totalGrossPay: records.reduce((sum, r) => sum + (r.earnings.grossPay || 0), 0),
      totalDeductions: records.reduce((sum, r) => sum + (r.deductions.totalDeductions || 0), 0),
      totalNetPay: records.reduce((sum, r) => sum + (r.netPay || 0), 0),
      totalSSS: records.reduce((sum, r) => sum + (r.deductions.sssContribution || 0), 0),
      totalPhilHealth: records.reduce((sum, r) => sum + (r.deductions.philhealthContribution || 0), 0),
      totalPagIBIG: records.reduce((sum, r) => sum + (r.deductions.pagibigContribution || 0), 0),
      totalTax: records.reduce((sum, r) => sum + (r.deductions.withholdinTax || 0), 0),
      recordsByStatus: {
        draft: records.filter((r) => r.status === 'draft').length,
        computed: records.filter((r) => r.status === 'computed').length,
        approved: records.filter((r) => r.status === 'approved').length,
        locked: records.filter((r) => r.status === 'locked').length,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        payrollPeriod,
        summary,
      },
    });
  } catch (error) {
    console.error('Get payroll summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll summary',
      error: error.message,
    });
  }
};

module.exports = exports;
