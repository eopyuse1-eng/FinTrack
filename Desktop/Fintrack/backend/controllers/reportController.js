/**
 * Report Controller - PDF & Excel Export
 * Centralized reporting for: Attendance, Payroll, Leave, Performance
 * Production-ready with error handling, validation, logging
 */

const { Attendance } = require('../models/Attendance');
const { Leave } = require('../models/Leave');
const PayrollRecord = require('../models/PayrollRecord');
const Payslip = require('../models/Payslip');
const PayrollPeriod = require('../models/PayrollPeriod');
const { User } = require('../models/User');
const Announcement = require('../models/Announcement');
const PerformanceEvaluation = require('../models/PerformanceEvaluation');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure reports directory exists
 */
const ensureReportDirectory = () => {
  const reportDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  return reportDir;
};

/**
 * Format date for reports
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format currency for reports
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

// ============================================================================
// ATTENDANCE REPORT EXPORTS
// ============================================================================

/**
 * GET ATTENDANCE REPORT DATA
 * GET /api/reports/attendance/data
 * Fetch attendance data with filters
 */
exports.getAttendanceReportData = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    let query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    // Build filters
    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.employee = { $in: deptEmployees.map((e) => e._id) };
    }

    if (status) {
      query.status = status;
    }

    const records = await Attendance.find(query)
      .populate('employee', 'firstName lastName email department position')
      .lean()
      .exec();

    // Calculate summary statistics
    const totalRecords = records.length;
    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const lateCount = records.filter((r) => r.late).length;
    const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        records,
        summary: {
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          totalOvertimeHours,
          averageAttendanceRate: ((presentCount / totalRecords) * 100).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('Get attendance report data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance report data',
      error: error.message,
    });
  }
};

/**
 * EXPORT ATTENDANCE TO EXCEL
 * POST /api/reports/attendance/excel
 */
exports.exportAttendanceExcel = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    let query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.employee = { $in: deptEmployees.map((e) => e._id) };
    }

    if (status) {
      query.status = status;
    }

    const records = await Attendance.find(query)
      .populate('employee', 'firstName lastName email department position')
      .lean()
      .exec();

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Set column widths
    worksheet.columns = [
      { header: 'Employee Name', key: 'employeeName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Check In', key: 'checkInTime', width: 12 },
      { header: 'Check Out', key: 'checkOutTime', width: 12 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Late (mins)', key: 'late', width: 10 },
      { header: 'Undertime (mins)', key: 'undertime', width: 12 },
      { header: 'OT Hours', key: 'overtimeHours', width: 10 },
    ];

    // Add title row
    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = `Attendance Report: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Style header row
    worksheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
    worksheet.getRow(3).alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data rows
    records.forEach((record) => {
      worksheet.addRow({
        employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
        email: record.employee.email,
        department: record.employee.department || 'N/A',
        date: formatDate(record.date),
        checkInTime: record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A',
        checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A',
        status: record.status,
        late: record.late || 0,
        undertime: record.undertime || 0,
        overtimeHours: record.overtimeHours || 0,
      });
    });

    // Apply alternating row colors
    for (let i = 4; i <= records.length + 3; i++) {
      if (i % 2 === 0) {
        worksheet.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      }
    }

    // Generate file
    const reportDir = ensureReportDirectory();
    const filename = `Attendance_${Date.now()}.xlsx`;
    const filepath = path.join(reportDir, filename);

    await workbook.xlsx.writeFile(filepath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Attendance_Report_${formatDate(new Date()).replace(/\s/g, '_')}.xlsx"`);

    res.download(filepath, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      fs.unlink(filepath, (err) => {
        if (err) console.error('File cleanup error:', err);
      });
    });
  } catch (error) {
    console.error('Export attendance to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting attendance report',
      error: error.message,
    });
  }
};

/**
 * EXPORT ATTENDANCE TO PDF
 * POST /api/reports/attendance/pdf
 */
exports.exportAttendancePDF = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    let query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.employee = { $in: deptEmployees.map((e) => e._id) };
    }

    if (status) {
      query.status = status;
    }

    const records = await Attendance.find(query)
      .populate('employee', 'firstName lastName email department position')
      .lean()
      .exec();

    const doc = new PDFDocument({ margin: 50 });

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text('ATTENDANCE REPORT', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Period: ${formatDate(startDate)} to ${formatDate(endDate)}`, { align: 'center' });
    doc.moveDown();

    // Summary statistics
    const totalRecords = records.length;
    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;

    doc.fontSize(10).text('SUMMARY STATISTICS');
    doc.text(`Total Records: ${totalRecords}`);
    doc.text(`Present: ${presentCount} (${((presentCount / totalRecords) * 100).toFixed(2)}%)`);
    doc.text(`Absent: ${absentCount} (${((absentCount / totalRecords) * 100).toFixed(2)}%)`);
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 250;
    const col4 = 350;
    const col5 = 450;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Employee', col1, tableTop);
    doc.text('Date', col2, tableTop);
    doc.text('Check In', col3, tableTop);
    doc.text('Status', col4, tableTop);
    doc.text('OT Hours', col5, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table data
    doc.font('Helvetica').fontSize(8);
    let yPosition = tableTop + 25;

    records.forEach((record) => {
      const employeeName = `${record.employee.firstName} ${record.employee.lastName}`;
      doc.text(employeeName, col1, yPosition, { width: 100 });
      doc.text(formatDate(record.date), col2, yPosition, { width: 100 });
      doc.text(record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A', col3, yPosition, { width: 100 });
      doc.text(record.status, col4, yPosition, { width: 100 });
      doc.text(record.overtimeHours || '0', col5, yPosition, { width: 100 });

      yPosition += 15;

      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Attendance_Report_${formatDate(new Date()).replace(/\s/g, '_')}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Export attendance to PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting attendance report to PDF',
      error: error.message,
    });
  }
};

// ============================================================================
// PAYROLL REPORT EXPORTS
// ============================================================================

/**
 * GET PAYROLL REPORT DATA
 * GET /api/reports/payroll/data
 */
exports.getPayrollReportData = async (req, res) => {
  try {
    const { payrollPeriodId, department, status } = req.query;

    if (!payrollPeriodId) {
      return res.status(400).json({
        success: false,
        message: 'payrollPeriodId is required',
      });
    }

    let query = { payrollPeriod: payrollPeriodId };

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.employee = { $in: deptEmployees.map((e) => e._id) };
    }

    if (status) {
      query.status = status;
    }

    const records = await PayrollRecord.find(query)
      .populate('employee', 'firstName lastName email department')
      .lean()
      .exec();

    const period = await PayrollPeriod.findById(payrollPeriodId).lean().exec();

    // Calculate totals
    const totalGrossPay = records.reduce((sum, r) => sum + (r.earnings?.grossPay || 0), 0);
    const totalDeductions = records.reduce((sum, r) => sum + (r.deductions?.totalDeductions || 0), 0);
    const totalNetPay = records.reduce((sum, r) => sum + (r.netPay || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        records,
        period,
        summary: {
          totalEmployees: records.length,
          totalGrossPay,
          totalDeductions,
          totalNetPay,
          averageNetPay: records.length > 0 ? (totalNetPay / records.length).toFixed(2) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get payroll report data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll report data',
      error: error.message,
    });
  }
};

/**
 * EXPORT PAYROLL TO EXCEL
 * POST /api/reports/payroll/excel
 */
exports.exportPayrollExcel = async (req, res) => {
  try {
    const { payrollPeriodId, department, status } = req.body;

    if (!payrollPeriodId) {
      return res.status(400).json({
        success: false,
        message: 'payrollPeriodId is required',
      });
    }

    let query = { payrollPeriod: payrollPeriodId };

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.employee = { $in: deptEmployees.map((e) => e._id) };
    }

    if (status) {
      query.status = status;
    }

    const records = await PayrollRecord.find(query)
      .populate('employee', 'firstName lastName email department')
      .lean()
      .exec();

    const period = await PayrollPeriod.findById(payrollPeriodId).lean().exec();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll Report');

    worksheet.columns = [
      { header: 'Employee', key: 'employee', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Gross Pay', key: 'grossPay', width: 15 },
      { header: 'SSS', key: 'sss', width: 12 },
      { header: 'PhilHealth', key: 'philhealth', width: 12 },
      { header: 'Pag-IBIG', key: 'pagibig', width: 12 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Total Deductions', key: 'totalDeductions', width: 15 },
      { header: 'Net Pay', key: 'netPay', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // Title
    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = `Payroll Report - ${period?.periodName || 'Unknown Period'}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };

    // Header formatting
    worksheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };

    // Add data with currency formatting
    records.forEach((record) => {
      const row = worksheet.addRow({
        employee: `${record.employee.firstName} ${record.employee.lastName}`,
        department: record.employee.department || 'N/A',
        grossPay: record.earnings?.grossPay || 0,
        sss: record.deductions?.sssContribution || 0,
        philhealth: record.deductions?.philhealthContribution || 0,
        pagibig: record.deductions?.pagibigContribution || 0,
        tax: record.deductions?.withholdinTax || 0,
        totalDeductions: record.deductions?.totalDeductions || 0,
        netPay: record.netPay || 0,
        status: record.status,
      });

      // Apply currency format to numeric columns
      ['C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
        row.getCell(col).numFmt = '#,##0.00';
      });
    });

    // Add totals row
    const totalRow = worksheet.addRow({
      employee: 'TOTAL',
      department: '',
      grossPay: records.reduce((sum, r) => sum + (r.earnings?.grossPay || 0), 0),
      sss: records.reduce((sum, r) => sum + (r.deductions?.sssContribution || 0), 0),
      philhealth: records.reduce((sum, r) => sum + (r.deductions?.philhealthContribution || 0), 0),
      pagibig: records.reduce((sum, r) => sum + (r.deductions?.pagibigContribution || 0), 0),
      tax: records.reduce((sum, r) => sum + (r.deductions?.withholdinTax || 0), 0),
      totalDeductions: records.reduce((sum, r) => sum + (r.deductions?.totalDeductions || 0), 0),
      netPay: records.reduce((sum, r) => sum + (r.netPay || 0), 0),
    });

    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };

    const reportDir = ensureReportDirectory();
    const filename = `Payroll_${Date.now()}.xlsx`;
    const filepath = path.join(reportDir, filename);

    await workbook.xlsx.writeFile(filepath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Payroll_Report_${period?.periodName || 'Report'}.xlsx"`);

    res.download(filepath, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(filepath, (err) => {
        if (err) console.error('File cleanup error:', err);
      });
    });
  } catch (error) {
    console.error('Export payroll to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting payroll report',
      error: error.message,
    });
  }
};

/**
 * EXPORT PAYROLL TO PDF
 * POST /api/reports/payroll/pdf
 */
exports.exportPayrollPDF = async (req, res) => {
  try {
    const { payrollPeriodId } = req.body;

    if (!payrollPeriodId) {
      return res.status(400).json({
        success: false,
        message: 'payrollPeriodId is required',
      });
    }

    const records = await PayrollRecord.find({ payrollPeriod: payrollPeriodId })
      .populate('employee', 'firstName lastName email department')
      .lean()
      .exec();

    const period = await PayrollPeriod.findById(payrollPeriodId).lean().exec();

    const doc = new PDFDocument({ margin: 30, size: 'A4', orientation: 'landscape' });

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text(`PAYROLL REPORT - ${period?.periodName || 'Unknown Period'}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown();

    // Summary
    const totalGrossPay = records.reduce((sum, r) => sum + (r.earnings?.grossPay || 0), 0);
    const totalNetPay = records.reduce((sum, r) => sum + (r.netPay || 0), 0);

    doc.fontSize(9).text(`Total Employees: ${records.length} | Total Gross Pay: ${formatCurrency(totalGrossPay)} | Total Net Pay: ${formatCurrency(totalNetPay)}`);
    doc.moveDown();

    // Table
    const tableTop = doc.y;
    const cellPadding = 5;
    const columns = [
      { key: 'employee', header: 'Employee', width: 120 },
      { key: 'dept', header: 'Dept', width: 80 },
      { key: 'gross', header: 'Gross Pay', width: 80 },
      { key: 'deductions', header: 'Deductions', width: 80 },
      { key: 'netPay', header: 'Net Pay', width: 80 },
    ];

    doc.font('Helvetica-Bold').fontSize(9);
    let xPos = 30;
    columns.forEach((col) => {
      doc.text(col.header, xPos, tableTop, { width: col.width, align: 'left' });
      xPos += col.width;
    });

    doc.moveTo(30, tableTop + 15).lineTo(750, tableTop + 15).stroke();

    doc.font('Helvetica').fontSize(8);
    let yPos = tableTop + 25;

    records.forEach((record) => {
      xPos = 30;
      const rowData = [
        `${record.employee.firstName} ${record.employee.lastName}`,
        record.employee.department || 'N/A',
        formatCurrency(record.earnings?.grossPay || 0),
        formatCurrency(record.deductions?.totalDeductions || 0),
        formatCurrency(record.netPay || 0),
      ];

      rowData.forEach((data, idx) => {
        doc.text(data, xPos, yPos, { width: columns[idx].width, align: 'left' });
        xPos += columns[idx].width;
      });

      yPos += 15;

      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Payroll_Report_${period?.periodName || 'Report'}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Export payroll to PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting payroll report to PDF',
      error: error.message,
    });
  }
};

// ============================================================================
// LEAVE REPORT EXPORTS
// ============================================================================

/**
 * GET LEAVE REPORT DATA
 * GET /api/reports/leave/data
 */
exports.getLeaveReportData = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    let query = {
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) },
    };

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.submittedBy = { $in: deptEmployees.map((e) => e._id) };
    }

    if (status) {
      query.status = status;
    }

    const records = await Leave.find(query)
      .populate('submittedBy', 'firstName lastName email department')
      .populate('approvedBy', 'firstName lastName')
      .lean()
      .exec();

    const approvedLeaves = records.filter((r) => r.status === 'approved');
    const totalApprovedDays = approvedLeaves.reduce((sum, r) => sum + (r.numberOfDays || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        records,
        summary: {
          totalRequests: records.length,
          approved: approvedLeaves.length,
          pending: records.filter((r) => r.status === 'pending').length,
          rejected: records.filter((r) => r.status === 'rejected').length,
          totalApprovedDays,
        },
      },
    });
  } catch (error) {
    console.error('Get leave report data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave report data',
      error: error.message,
    });
  }
};

/**
 * EXPORT LEAVE TO EXCEL
 * POST /api/reports/leave/excel
 */
exports.exportLeaveExcel = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    let query = {
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) },
    };

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.submittedBy = { $in: deptEmployees.map((e) => e._id) };
    }

    if (status) {
      query.status = status;
    }

    const records = await Leave.find(query)
      .populate('submittedBy', 'firstName lastName email department')
      .lean()
      .exec();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leave Report');

    worksheet.columns = [
      { header: 'Employee', key: 'employee', width: 20 },
      { header: 'Leave Type', key: 'leaveType', width: 15 },
      { header: 'Start Date', key: 'startDate', width: 12 },
      { header: 'End Date', key: 'endDate', width: 12 },
      { header: 'Days', key: 'days', width: 8 },
      { header: 'Reason', key: 'reason', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = `Leave Report: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };

    worksheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };

    records.forEach((record) => {
      worksheet.addRow({
        employee: `${record.submittedBy.firstName} ${record.submittedBy.lastName}`,
        leaveType: record.leaveType,
        startDate: formatDate(record.startDate),
        endDate: formatDate(record.endDate),
        days: record.numberOfDays,
        reason: record.reason || 'N/A',
        status: record.status,
      });
    });

    const reportDir = ensureReportDirectory();
    const filename = `Leave_${Date.now()}.xlsx`;
    const filepath = path.join(reportDir, filename);

    await workbook.xlsx.writeFile(filepath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Leave_Report_${formatDate(new Date()).replace(/\s/g, '_')}.xlsx"`);

    res.download(filepath, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(filepath, (err) => {
        if (err) console.error('File cleanup error:', err);
      });
    });
  } catch (error) {
    console.error('Export leave to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting leave report',
      error: error.message,
    });
  }
};

/**
 * EXPORT LEAVE TO PDF
 * POST /api/reports/leave/pdf
 */
exports.exportLeavePDF = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    let query = {
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) },
    };

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.submittedBy = { $in: deptEmployees.map((e) => e._id) };
    }

    if (status) {
      query.status = status;
    }

    const records = await Leave.find(query)
      .populate('submittedBy', 'firstName lastName email department')
      .lean()
      .exec();

    const doc = new PDFDocument({ margin: 50 });

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text('LEAVE REPORT', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Period: ${formatDate(startDate)} to ${formatDate(endDate)}`, { align: 'center' });
    doc.moveDown();

    // Summary statistics
    const approvedLeaves = records.filter((r) => r.status === 'approved');
    const totalApprovedDays = approvedLeaves.reduce((sum, r) => sum + (r.numberOfDays || 0), 0);

    doc.fontSize(10).text('SUMMARY STATISTICS');
    doc.text(`Total Requests: ${records.length}`);
    doc.text(`Approved: ${approvedLeaves.length}`);
    doc.text(`Pending: ${records.filter((r) => r.status === 'pending').length}`);
    doc.text(`Rejected: ${records.filter((r) => r.status === 'rejected').length}`);
    doc.text(`Total Approved Days: ${totalApprovedDays}`);
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 160;
    const col3 = 260;
    const col4 = 340;
    const col5 = 420;
    const col6 = 500;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Employee', col1, tableTop);
    doc.text('Leave Type', col2, tableTop);
    doc.text('Start Date', col3, tableTop);
    doc.text('End Date', col4, tableTop);
    doc.text('Days', col5, tableTop);
    doc.text('Status', col6, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table data
    doc.font('Helvetica').fontSize(8);
    let yPosition = tableTop + 25;

    records.forEach((record) => {
      const employeeName = `${record.submittedBy.firstName} ${record.submittedBy.lastName}`;
      doc.text(employeeName, col1, yPosition, { width: 110 });
      doc.text(record.leaveType, col2, yPosition, { width: 100 });
      doc.text(formatDate(record.startDate), col3, yPosition, { width: 80 });
      doc.text(formatDate(record.endDate), col4, yPosition, { width: 80 });
      doc.text(record.numberOfDays.toString(), col5, yPosition, { width: 80 });
      doc.text(record.status, col6, yPosition, { width: 50 });

      yPosition += 15;

      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Leave_Report_${formatDate(new Date()).replace(/\s/g, '_')}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Export leave to PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting leave report to PDF',
      error: error.message,
    });
  }
};

// ============================================================================
// PERFORMANCE EVALUATION REPORT EXPORTS
// ============================================================================

/**
 * GET PERFORMANCE REPORT DATA
 * GET /api/reports/performance/data
 */
exports.getPerformanceReportData = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }

    const records = await PerformanceEvaluation.find(query)
      .populate('employeeId', 'firstName lastName email department')
      .exec();

    // Calculate statistics
    const highPerformers = records.filter((r) => r.overallScore >= 4).length;
    const averagePerformers = records.filter((r) => r.overallScore === 3).length;
    const lowPerformers = records.filter((r) => r.overallScore <= 2).length;

    res.status(200).json({
      success: true,
      data: {
        records,
        summary: {
          totalEvaluations: records.length,
          highPerformers,
          averagePerformers,
          lowPerformers,
        },
      },
    });
  } catch (error) {
    console.error('Get performance report data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance report data',
      error: error.message,
    });
  }
};

/**
 * EXPORT PERFORMANCE TO EXCEL
 * POST /api/reports/performance/excel
 */
exports.exportPerformanceExcel = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.body;

    let query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }

    const records = await PerformanceEvaluation.find(query)
      .populate('employeeId', 'firstName lastName email department')
      .exec();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Performance Evaluation Report');

    worksheet.columns = [
      { header: 'Employee', key: 'employee', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Period', key: 'period', width: 25 },
      { header: 'Overall Score', key: 'score', width: 12 },
      { header: 'Rating', key: 'rating', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Quality of Work', key: 'qualityOfWork', width: 12 },
      { header: 'Job Knowledge', key: 'jobKnowledge', width: 12 },
      { header: 'Reliability', key: 'reliability', width: 12 },
    ];

    // Title
    worksheet.mergeCells('A1:I1');
    worksheet.getCell('A1').value = `Performance Evaluation Report${startDate ? ` - ${formatDate(startDate)} to ${formatDate(endDate)}` : ''}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };

    // Header formatting
    worksheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };

    // Helper function to get rating
    const getRating = (score) => {
      if (score >= 4) return 'Excellent';
      if (score === 3) return 'Average';
      if (score === 2) return 'Below Average';
      return 'Poor';
    };

    records.forEach((record) => {
      const startDate = record.periodCovered ? new Date(record.periodCovered.startDate) : new Date();
      const endDate = record.periodCovered ? new Date(record.periodCovered.endDate) : new Date();
      worksheet.addRow({
        employee: `${record.employeeId.firstName} ${record.employeeId.lastName}`,
        department: record.employeeId.department || 'N/A',
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        score: record.overallScore || 0,
        rating: getRating(record.overallScore || 0),
        status: record.status || 'N/A',
        qualityOfWork: record.competencies?.qualityOfWork?.score || 'N/A',
        jobKnowledge: record.competencies?.jobKnowledge?.score || 'N/A',
        reliability: record.competencies?.reliability?.score || 'N/A',
      });
    });

    const reportDir = ensureReportDirectory();
    const filename = `Performance_${Date.now()}.xlsx`;
    const filepath = path.join(reportDir, filename);

    await workbook.xlsx.writeFile(filepath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Performance_Report_${formatDate(new Date()).replace(/\s/g, '_')}.xlsx"`);

    res.download(filepath, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(filepath, (err) => {
        if (err) console.error('File cleanup error:', err);
      });
    });
  } catch (error) {
    console.error('Export performance to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting performance report',
      error: error.message,
    });
  }
};

/**
 * EXPORT PERFORMANCE TO PDF
 * POST /api/reports/performance/pdf
 */
exports.exportPerformancePDF = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.body;

    let query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      query.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }

    const records = await PerformanceEvaluation.find(query)
      .populate('employeeId', 'firstName lastName email department')
      .exec();

    const doc = new PDFDocument({ margin: 40, size: 'A4', orientation: 'landscape' });

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text('PERFORMANCE EVALUATION REPORT', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown();

    // Summary statistics
    const highPerformers = records.filter((r) => r.overallScore >= 4).length;
    const averagePerformers = records.filter((r) => r.overallScore === 3).length;
    const lowPerformers = records.filter((r) => r.overallScore <= 2).length;

    doc.fontSize(9).text(`Total Evaluations: ${records.length} | High Performers: ${highPerformers} | Average: ${averagePerformers} | Low Performers: ${lowPerformers}`);
    doc.moveDown();

    // Table
    const tableTop = doc.y;
    const getRating = (score) => {
      if (score >= 4) return 'Excellent';
      if (score === 3) return 'Average';
      if (score === 2) return 'Below Average';
      return 'Poor';
    };

    const columns = [
      { key: 'employee', header: 'Employee', width: 130 },
      { key: 'dept', header: 'Department', width: 100 },
      { key: 'score', header: 'Score', width: 60 },
      { key: 'rating', header: 'Rating', width: 80 },
      { key: 'status', header: 'Status', width: 80 },
    ];

    doc.font('Helvetica-Bold').fontSize(9);
    let xPos = 40;
    columns.forEach((col) => {
      doc.text(col.header, xPos, tableTop, { width: col.width, align: 'center' });
      xPos += col.width;
    });

    doc.moveTo(40, tableTop + 15).lineTo(750, tableTop + 15).stroke();

    doc.font('Helvetica').fontSize(8);
    let yPos = tableTop + 25;

    records.forEach((record) => {
      xPos = 40;
      const rowData = [
        `${record.employeeId.firstName} ${record.employeeId.lastName}`,
        record.employeeId.department || 'N/A',
        (record.overallScore || 0).toString(),
        getRating(record.overallScore || 0),
        record.status || 'N/A',
      ];

      rowData.forEach((data, idx) => {
        doc.text(data, xPos, yPos, { width: columns[idx].width, align: 'center' });
        xPos += columns[idx].width;
      });

      yPos += 15;

      if (yPos > 680) {
        doc.addPage();
        yPos = 50;
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Performance_Report_${formatDate(new Date()).replace(/\s/g, '_')}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Export performance to PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting performance report to PDF',
      error: error.message,
    });
  }
};

module.exports = exports;
