import React, { useState, useEffect } from 'react';
import FileCorrectionForm from './TimeCorrection/FileCorrectionForm';
import './styles/AttendanceWidget.css';

/**
 * Reusable Attendance Widget Component
 * Shows check-in/check-out buttons and today's attendance data
 * Used in HR Head and HR Staff dashboards
 */
function AttendanceWidget() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
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
    <>
      {/* Time Correction Form Modal */}
      {showCorrectionForm && attendance && (
        <FileCorrectionForm
          attendanceRecord={attendance}
          onClose={() => setShowCorrectionForm(false)}
          onSuccess={() => {
            setShowCorrectionForm(false);
            fetchTodayAttendance();
          }}
        />
      )}

      <div className="attendance-widget">
        <div className="widget-header">
          <h3>Daily Attendance</h3>
        </div>

        {/* Error and Success Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

      {/* Check-In / Check-Out Actions */}
      <div className="attendance-actions">
        <div className="action-card">
          <p className="action-description">Mark your presence for today</p>

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

            {/* File Correction Button */}
            {/* Show if already checked in today */}
            <button
              onClick={() => setShowCorrectionForm(true)}
              disabled={!attendance?.checkInTime || loading}
              className="btn btn-correction"
              title={!attendance?.checkInTime ? 'Check in first to file a correction' : 'File a time correction request'}
            >
              📋 File Correction
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
              {attendance.totalHours > 0 ? `${attendance.totalHours.toFixed(2)} hrs` : '-'}
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
    </>
  );
}

export default AttendanceWidget;
