import React, { useState, useEffect } from 'react';
import './Attendance.css';

function Attendance() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [departmentAttendance, setDepartmentAttendance] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Get current user from localStorage
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      setUser(userData);
      // HR Staff and HR Head can see department/all attendance
      if (['hr_staff', 'hr_head'].includes(userData.role)) {
        fetchDepartmentAttendance();
      }
    }
    fetchTodayAttendance();
  }, []);

  /**
   * Fetch today's attendance record
   */
  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/attendance/today', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAttendance(data.data);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  /**
   * Fetch department attendance for HR Staff and HR Head
   */
  const fetchDepartmentAttendance = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
      const userData = JSON.parse(userString);

      let endpoint = '/api/attendance/paginated';

      const response = await fetch(`http://localhost:5000${endpoint}?page=${page}&limit=10&search=${searchTerm}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setDepartmentAttendance(data.data.records);
        setTotalPages(data.data.pagination.totalPages);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Error fetching department attendance:', err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchDepartmentAttendance(newPage);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDepartmentAttendance(1);
  };

  /**
   * Handle check-in
   * Business logic:
   * - Show confirmation alert
   * - Disable button if already checked in
   * - Fetch updated attendance after success
   */
  const handleCheckIn = async () => {
    // Confirmation alert before checking in
    if (!window.confirm('Are you sure you want to check in?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/attendance/checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        fetchTodayAttendance(); // Refresh attendance data
      } else {
        setError(data.message || 'Check-in failed');
      }
    } catch (err) {
      console.error('Check-in error:', err);
      setError('Error during check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle check-out
   * Business logic:
   * - Show confirmation alert
   * - Disable button if already checked out
   * - Calculate total hours on backend
   * - Fetch updated attendance after success
   */
  const handleCheckOut = async () => {
    // Confirmation alert before checking out
    if (!window.confirm('Are you sure you want to check out?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/attendance/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        fetchTodayAttendance(); // Refresh attendance data
      } else {
        setError(data.message || 'Check-out failed');
      }
    } catch (err) {
      console.error('Check-out error:', err);
      setError('Error during check-out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Determine if check-in button should be disabled
   * Disabled if already checked in today
   */
  const isCheckInDisabled = () => {
    if (!attendance) return false;
    return attendance.checkInTime !== null;
  };

  /**
   * Determine if check-out button should be disabled
   * Disabled if no check-in exists or already checked out
   */
  const isCheckOutDisabled = () => {
    if (!attendance) return true; // Need attendance record first
    return attendance.checkOutTime !== null || attendance.checkInTime === null;
  };

  /**
   * Format time for display
   */
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  /**
   * Get status badge color based on status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'status-present';
      case 'late':
        return 'status-late';
      case 'absent':
        return 'status-absent';
      case 'checked-out':
        return 'status-checked-out';
      default:
        return '';
    }
  };

  return (
    <div className="attendance-section">
      {/* Header */}
      <div className="section-header">
        <h2>Attendance Management</h2>
        <p>Track your daily attendance or view team records</p>
      </div>

      {/* Error and Success Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* My Attendance Section */}
      <div className="attendance-my-attendance">
        <h3>My Daily Attendance</h3>

        {/* Check-In / Check-Out Actions */}
        <div className="attendance-actions">
          <div className="action-card">
            <p className="action-description">Mark your presence for the day</p>

            <div className="buttons-group">
              {/* Check-In Button */}
              {/* Disabled if already checked in today */}
              <button
                onClick={handleCheckIn}
                disabled={isCheckInDisabled() || loading}
                className="btn btn-checkin"
                title={isCheckInDisabled() ? 'Already checked in today' : 'Click to check in'}
              >
                {loading ? 'Processing...' : '✓ Check In'}
              </button>

              {/* Check-Out Button */}
              {/* Disabled if no check-in or already checked out */}
              <button
                onClick={handleCheckOut}
                disabled={isCheckOutDisabled() || loading}
                className="btn btn-checkout"
                title={
                  isCheckOutDisabled()
                    ? 'Check in first or already checked out'
                    : 'Click to check out'
                }
              >
                {loading ? 'Processing...' : '✕ Check Out'}
              </button>
            </div>
          </div>
        </div>

        {/* Today's Attendance Details */}
        {attendance ? (
          <div className="attendance-info-grid">
            <div className="info-item">
              <label>Check-In Time</label>
              <span className="info-value">
                {formatTime(attendance.checkInTime)}
              </span>
            </div>

            <div className="info-item">
              <label>Check-Out Time</label>
              <span className="info-value">
                {formatTime(attendance.checkOutTime)}
              </span>
            </div>

            <div className="info-item">
              <label>Total Hours</label>
              <span className="info-value">
                {attendance.totalHours > 0 ? `${attendance.totalHours} hrs` : '-'}
              </span>
            </div>

            <div className="info-item">
              <label>Status</label>
              <span className={`status-badge ${getStatusColor(attendance.status)}`}>
                {attendance.status.charAt(0).toUpperCase() +
                  attendance.status.slice(1)}
              </span>
            </div>
          </div>
        ) : (
          <div className="no-attendance">
            <p>No attendance record for today yet.</p>
            <p className="hint">Click "Check In" to get started.</p>
          </div>
        )}
      </div>

      {/* Department/All Attendance Section - HR Staff and HR Head Only */}
      {user && ['hr_staff', 'hr_head'].includes(user.role) && (
        <div className="attendance-department-view">
          <div className="view-toggle">
            <h3>
              {user.role === 'hr_head'
                ? 'All Employees Attendance'
                : `${user.department} Department Attendance`}
            </h3>
            <button
              onClick={() => fetchDepartmentAttendance(currentPage)}
              className="btn btn-secondary"
            >
              🔄 Refresh
            </button>
          </div>

          {departmentAttendance.length > 0 ? (
            <>
            <div className="attendance-table">
              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentAttendance.map((record) => (
                    <tr key={record._id}>
                      <td>
                        <strong>
                          {record.employee.firstName} {record.employee.lastName}
                        </strong>
                      </td>
                      <td>{record.department}</td>
                      <td>{formatTime(record.checkInTime)}</td>
                      <td>{formatTime(record.checkOutTime)}</td>
                      <td>{record.totalHours > 0 ? `${record.totalHours} hrs` : '-'}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() +
                            record.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ padding: '0.5rem 1rem', background: currentPage === 1 ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: currentPage === 1 ? 'default' : 'pointer' }}
              >
                ← Previous
              </button>
              <span style={{ margin: '0 1rem' }}>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{ padding: '0.5rem 1rem', background: currentPage === totalPages ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: currentPage === totalPages ? 'default' : 'pointer' }}
              >
                Next →
              </button>
            </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No attendance records found yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Status Guide */}
      <div className="status-guide">
        <h3>Attendance Status Guide</h3>
        <div className="guide-items">
          <div className="guide-item">
            <span className="guide-badge status-present">Present</span>
            <p>Checked in before 9:00 AM</p>
          </div>
          <div className="guide-item">
            <span className="guide-badge status-late">Late</span>
            <p>Checked in after 9:00 AM but before 1:30 PM</p>
          </div>
          <div className="guide-item">
            <span className="guide-badge status-absent">Absent</span>
            <p>Checked in after 1:30 PM or no check-in</p>
          </div>
          <div className="guide-item">
            <span className="guide-badge status-checked-out">Checked Out</span>
            <p>Successfully checked out for the day</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
