import React, { useState, useEffect } from 'react';
import '../styles/TimeCorrection.css';

const PendingLeave = ({ userRole }) => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchPendingLeaves();
  }, [refreshTrigger]);

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leave/pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPendingLeaves(data.data);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch pending leaves');
      }
    } catch (err) {
      setError('Error fetching pending leaves');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId, comments = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leave/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ comments }),
      });

      const data = await response.json();
      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(data.message || 'Failed to approve leave');
      }
    } catch (err) {
      alert('Error approving leave');
      console.error(err);
    }
  };

  const handleReject = async (leaveId) => {
    const rejectionReason = prompt('Enter rejection reason:');
    if (!rejectionReason) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leave/${leaveId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason }),
      });

      const data = await response.json();
      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(data.message || 'Failed to reject leave');
      }
    } catch (err) {
      alert('Error rejecting leave');
      console.error(err);
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-error)' }}>{error}</div>;
  }

  if (pendingLeaves.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
        <p>No pending leave requests to approve.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead style={{ backgroundColor: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Employee</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Leave Type</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Duration</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Days</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Reason</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingLeaves.map((leave) => (
              <tr key={leave._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>
                  <strong>{leave.employee.firstName} {leave.employee.lastName}</strong>
                  <br />
                  <small style={{ color: '#666' }}>{leave.employee.email}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
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
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  {leave.reason.substring(0, 50)}...
                </td>
                <td style={{ padding: '1rem' }}>{getStatusBadge(leave.status)}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleApprove(leave._id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(leave._id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingLeave;
