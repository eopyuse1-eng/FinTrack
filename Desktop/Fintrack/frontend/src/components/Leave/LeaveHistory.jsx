import React, { useState, useEffect } from 'react';
import LeaveForm from './LeaveForm';
import '../styles/TimeCorrection.css';

const LeaveHistory = ({ userRole }) => {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  useEffect(() => {
    fetchLeaveHistory();
  }, [statusFilter]);

  const fetchLeaveHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`http://localhost:5000/api/leave/history?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setLeaveHistory(data.data);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch leave history');
      }
    } catch (err) {
      setError('Error fetching leave history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    let bgColor, textColor, text;

    switch (status) {
      case 'pending':
        bgColor = 'var(--color-accent)';
        textColor = 'white';
        text = '⏳ Pending';
        break;
      case 'approved_by_supervisor':
        bgColor = 'var(--color-info)';
        textColor = 'white';
        text = '✓ Supervisor Approved';
        break;
      case 'approved_by_hr_staff':
        bgColor = 'var(--color-info)';
        textColor = 'white';
        text = '✓ HR Staff Approved';
        break;
      case 'approved_by_hr_head':
        bgColor = 'var(--color-info)';
        textColor = 'white';
        text = '✓ HR Head Approved';
        break;
      case 'approved':
        bgColor = 'var(--color-success)';
        textColor = 'white';
        text = '✓ Fully Approved';
        break;
      case 'rejected':
        bgColor = 'var(--color-error)';
        textColor = 'white';
        text = '✗ Rejected';
        break;
      default:
        bgColor = 'var(--color-bg-secondary)';
        textColor = 'var(--color-text)';
        text = status;
    }

    return (
      <span
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        {text}
      </span>
    );
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      vacation: 'var(--color-primary)',
      sick: 'var(--color-error)',
      personal: 'var(--color-accent)',
      bereavement: 'var(--color-text-secondary)',
      emergency: '#e83e8c',
      other: 'var(--color-info)',
    };
    return colors[type] || 'var(--color-text-secondary)';
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Filter by Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem',
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved_by_supervisor">Supervisor Approved</option>
            <option value="approved_by_hr_staff">HR Staff Approved</option>
            <option value="approved_by_hr_head">HR Head Approved</option>
            <option value="approved">Fully Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>


      </div>

      {loading ? (
        <p>Loading leave history...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : leaveHistory.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: '#f5f5f5' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Employee</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Duration</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Days</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Reason</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leaveHistory.map((leave) => (
                <tr key={leave._id} style={{ borderBottom: '1px solid #eee', backgroundColor: leave._id % 2 === 0 ? '#fafafa' : 'white' }}>
                  <td style={{ padding: '1rem' }}>
                    <strong>{leave.employee.firstName} {leave.employee.lastName}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{leave.employee.email}</small>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: getLeaveTypeColor(leave.leaveType),
                        color: 'white',
                        textTransform: 'capitalize',
                      }}
                    >
                      {leave.leaveType}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {new Date(leave.startDate).toLocaleDateString()} to{' '}
                    {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <strong>{leave.numberOfDays}</strong>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    {leave.reason.substring(0, 40)}
                    {leave.reason.length > 40 ? '...' : ''}
                  </td>
                  <td style={{ padding: '1rem' }}>{getStatusBadge(leave.status)}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    {new Date(leave.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          <p>No leave records found.</p>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;
