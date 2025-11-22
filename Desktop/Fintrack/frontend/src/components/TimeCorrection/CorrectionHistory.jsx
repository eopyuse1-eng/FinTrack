import React, { useState, useEffect } from 'react';
import '../styles/TimeCorrection.css';

const CorrectionHistory = ({ userRole }) => {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');

  useEffect(() => {
    fetchCorrectionHistory();
  }, []);

  const fetchCorrectionHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-correction/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch correction history');
      }

      setCorrections(data.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
      setCorrections([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments for filter
  const departments = [...new Set(corrections.map(c => c.department))];

  // Filter corrections
  const filteredCorrections = corrections.filter(correction => {
    const statusMatch = filterStatus === 'all' || correction.status === filterStatus;
    const departmentMatch = filterDepartment === 'all' || correction.department === filterDepartment;
    return statusMatch && departmentMatch;
  });

  const getStatusBadgeClass = (status) => {
    // Map new statuses to badge classes
    if (status.startsWith('approved_by_')) {
      return 'badge badge-pending'; // Show as pending-like since it's awaiting further approval
    }
    return `badge badge-${status}`;
  };

  const getStatusDisplay = (status) => {
    // Convert status to readable format
    if (status === 'pending') return 'Pending';
    if (status === 'approved_by_hr_staff') return '✓ HR Staff Approved';
    if (status === 'approved_by_hr_head') return '✓ HR Head Approved';
    if (status === 'approved_by_supervisor') return '✓ Supervisor Approved';
    if (status === 'approved') return '✓ Fully Approved';
    if (status === 'rejected') return '✗ Rejected';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading">Loading correction history...</div>;
  }

  return (
    <div className="correction-history-container">
      <div className="history-header">
        <h2>
          {userRole === 'employee' ? 'My ' : 'All '} Time Correction History
        </h2>
        <button 
          className="button button-secondary" 
          onClick={fetchCorrectionHistory}
          title="Refresh the correction history"
        >
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {userRole !== 'employee' && departments.length > 0 && (
          <div className="filter-group">
            <label>Filter by Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept.charAt(0).toUpperCase() + dept.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredCorrections.length === 0 ? (
        <div className="empty-state">
          <p>
            {corrections.length === 0
              ? 'No time corrections found'
              : 'No corrections match the selected filters'}
          </p>
        </div>
      ) : (
        <div className="corrections-table-wrapper">
          <table className="corrections-table">
            <thead>
              <tr>
                {userRole !== 'employee' && <th>Employee</th>}
                {userRole !== 'employee' && <th>Department</th>}
                <th>Correction Date</th>
                <th>Original Time</th>
                <th>Corrected Time</th>
                <th>Original Hours</th>
                <th>Corrected Hours</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredCorrections.map(correction => (
                <tr key={correction._id}>
                  {userRole !== 'employee' && (
                    <td className="employee-name">
                      {correction.employee?.firstName} {correction.employee?.lastName}
                    </td>
                  )}
                  {userRole !== 'employee' && (
                    <td className="department-cell">
                      {correction.department
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </td>
                  )}
                  <td className="date-cell">
                    {new Date(correction.correctionDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="time-cell">
                    {formatTime(correction.originalCheckInTime)} -{' '}
                    {formatTime(correction.originalCheckOutTime)}
                  </td>
                  <td className="time-cell">
                    <strong>
                      {formatTime(correction.correctedCheckInTime)} -{' '}
                      {formatTime(correction.correctedCheckOutTime)}
                    </strong>
                  </td>
                  <td className="hours-cell">
                    {correction.originalTotalHours
                      ? `${correction.originalTotalHours.toFixed(2)} hrs`
                      : '-'}
                  </td>
                  <td className="hours-cell">
                    <strong>
                      {correction.correctedTotalHours
                        ? `${correction.correctedTotalHours.toFixed(2)} hrs`
                        : '-'}
                    </strong>
                  </td>
                  <td className="status-cell">
                    <span className={getStatusBadgeClass(correction.status)}>
                      {getStatusDisplay(correction.status)}
                    </span>
                  </td>
                  <td className="reason-cell" title={correction.reason}>
                    {correction.reason.substring(0, 50)}
                    {correction.reason.length > 50 ? '...' : ''}
                  </td>
                  <td className="date-cell">
                    {formatDateTime(correction.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CorrectionHistory;
