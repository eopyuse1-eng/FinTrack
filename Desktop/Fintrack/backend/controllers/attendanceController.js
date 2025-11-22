const { Attendance } = require('../models/Attendance');
const { User } = require('../models/User');
const { Leave } = require('../models/Leave');

// Business logic constants
const OFFICIAL_START_TIME = 8; // 8 AM
const LATE_TIME = 9; // 9 AM - check-in after this is late
const ABSENT_TIME = 13.5; // 1:30 PM - check-in after this is absent

/**
 * POST /api/attendance/checkin
 * Employee checks in for the day
 * Business logic:
 * - Only one check-in per employee per day
 * - Check-in after 1:30 PM → status absent
 * - Check-in after official start but before 1:30 PM → status late
 * - Check-in before official start → status present
 */
exports.checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if employee already checked in today
    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today',
      });
    }

    // Get employee details for department
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Determine status based on check-in time
    const checkInTime = new Date();
    const hours = checkInTime.getHours() + checkInTime.getMinutes() / 60;

    let status = 'present';
    if (hours > ABSENT_TIME) {
      status = 'absent';
    } else if (hours > LATE_TIME) {
      status = 'late';
    }

    // Create or update attendance record
    let attendance = existingAttendance;
    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        department: employee.department,
      });
    }

    attendance.checkInTime = checkInTime;
    attendance.status = status;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: `Check-in successful. Status: ${status}`,
      data: attendance,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during check-in',
      error: error.message,
    });
  }
};

/**
 * POST /api/attendance/checkout
 * Employee checks out for the day
 * Business logic:
 * - Calculate totalHours between check-in and check-out
 * - Update status to checked-out if valid check-in exists
 * - If no check-in exists, mark as absent
 */
exports.checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No check-in record found for today',
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today',
      });
    }

    const checkOutTime = new Date();

    // Calculate total hours if check-in exists
    if (attendance.checkInTime) {
      const checkInTime = new Date(attendance.checkInTime);
      const totalMs = checkOutTime - checkInTime;
      const totalHours = totalMs / (1000 * 60 * 60); // Convert ms to hours
      attendance.totalHours = Math.round(totalHours * 100) / 100; // Round to 2 decimals
      attendance.status = 'checked-out';
    } else {
      // No check-in means absent
      attendance.status = 'absent';
      attendance.totalHours = 0;
    }

    attendance.checkOutTime = checkOutTime;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: `Check-out successful. Total hours: ${attendance.totalHours}`,
      data: attendance,
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during check-out',
      error: error.message,
    });
  }
};

/**
 * GET /api/attendance/today
 * Returns logged-in employee's today attendance
 * RBAC: Employee can only see their own
 */
exports.getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    }).populate('employee', 'firstName lastName email department');

    // Return success with null data if no attendance record yet
    res.status(200).json({
      success: true,
      data: attendance || null,
      message: attendance ? 'Today\'s attendance record found' : 'No attendance record for today yet',
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message,
    });
  }
};

/**
 * GET /api/attendance/department
 * Returns all attendance for the department
 * RBAC: HR Staff can only see their department's attendance
 */
exports.getDepartmentAttendance = async (req, res) => {
  try {
    const userDepartment = req.user.department;
    const { date } = req.query; // Optional: filter by specific date

    let query = { department: userDepartment };

    if (date) {
      const specificDate = new Date(date);
      specificDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(specificDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.date = {
        $gte: specificDate,
        $lt: nextDay,
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName email')
      .sort({ date: -1, 'employee.firstName': 1 });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get department attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message,
    });
  }
};

/**
 * GET /api/attendance/all
 * Returns all attendance for all employees
 * RBAC: HR Head only
 */
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, department } = req.query;

    let query = {};

    // Filter by date if provided
    if (date) {
      const specificDate = new Date(date);
      specificDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(specificDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.date = {
        $gte: specificDate,
        $lt: nextDay,
      };
    }

    // Filter by department if provided
    if (department) {
      query.department = department;
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName email department')
      .sort({ date: -1, department: 1, 'employee.firstName': 1 });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message,
    });
  }
};

/**
 * GET /api/attendance/report
 * Generate attendance report for date range
 * RBAC: HR Head and HR Staff (department filtered)
 */
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // HR Staff can only see their department
    let query = {};
    if (userRole === 'hr_staff') {
      query.department = userDepartment;
    } else if (department) {
      query.department = department;
    }

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.date = {
        $gte: start,
        $lte: end,
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName email department')
      .sort({ date: -1, 'employee.firstName': 1 });

    // Generate summary statistics
    const summary = {
      totalRecords: attendance.length,
      present: attendance.filter((a) => a.status === 'present').length,
      late: attendance.filter((a) => a.status === 'late').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      checkedOut: attendance.filter((a) => a.status === 'checked-out').length,
      averageHours:
        attendance.length > 0
          ? (
              attendance.reduce((sum, a) => sum + a.totalHours, 0) /
              attendance.length
            ).toFixed(2)
          : 0,
    };

    res.status(200).json({
      success: true,
      data: attendance,
      summary,
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message,
    });
  }
};

/**
 * GET /api/attendance/dashboard/stats
 * Get dashboard statistics for HR Staff
 * Returns: total employees, present today, absent today, pending leaves
 * RBAC: HR Staff and HR Head can access
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all employees (excluding HR roles)
    let employeeQuery = { role: 'employee' };
    let attendanceQuery = { date: today };

    // Count total employees (excluding HR staff and HR head)
    const totalEmployees = await User.countDocuments(employeeQuery);

    // Count HR Staff
    const hrStaffCount = await User.countDocuments({ role: 'hr_staff' });

    // Count HR Head
    const hrHeadCount = await User.countDocuments({ role: 'hr_head' });

    // Get today's attendance for all employees
    const todayAttendance = await Attendance.find(attendanceQuery);

    // Count present and absent
    const presentCount = todayAttendance.filter(
      (a) => a.status === 'present' || a.status === 'late'
    ).length;
    const absentCount = todayAttendance.filter(
      (a) => a.status === 'absent'
    ).length;

    // Get pending leaves (only for today onwards)
    let leaveQuery = {
      status: 'pending',
      startDate: {
        $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Today onwards
      },
    };

    const pendingLeaves = await Leave.countDocuments(leaveQuery);

    console.log('Dashboard Stats:', { totalEmployees, hrStaffCount, hrHeadCount, presentCount, absentCount, pendingLeaves });

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        hrStaffCount,
        hrHeadCount,
        presentToday: presentCount,
        absentToday: absentCount,
        pendingLeaves,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message,
    });
  }
};

/**
 * GET /api/attendance/paginated
 * Get paginated attendance records
 * HR Head and HR Staff can access
 * Query params: page (default 1), limit (default 10), search (optional)
 */
exports.getPaginatedAttendance = async (req, res) => {
  try {
    const userRole = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    let query = {};

    // Add search filter if provided (search by employee name or email)
    if (search) {
      const employees = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      });
      const employeeIds = employees.map(e => e._id);
      query.employee = { $in: employeeIds };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination info
    const total = await Attendance.countDocuments(query);
    
    // Get paginated records
    const records = await Attendance.find(query)
      .populate('employee', 'firstName lastName email department')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        records,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          recordsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error('Get paginated attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message,
    });
  }
};
