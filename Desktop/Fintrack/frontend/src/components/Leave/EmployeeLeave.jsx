import React, { useState, useEffect } from 'react';
import LeaveForm from './LeaveForm';

function EmployeeLeave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [leaveBalance, setLeaveBalance] = useState(0);

  useEffect(() => {
    fetchMyLeaves();
    fetchLeaveBalance();
  }, [statusFilter, refreshTrigger]);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`http://localhost:5000/api/leave/my-requests?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setLeaves(data.data || []);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch leaves');
      }
    } catch (err) {
      setError('Error fetching leaves');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setLeaveBalance(data.data.annualLeaveBalance || 0);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const getStatusBadge = (status) => {
    let bgColor, textColor, text;

    switch (status) {
      case 'pending':
        bgColor = '#fff3cd';
        textColor = '#856404';
        text = '⏳ Pending';
        break;
      case 'approved_by_supervisor':
        bgColor = '#d1ecf1';
        textColor = '#0c5460';
        text = '✓ Supervisor Approved';
        break;
      case 'approved_by_hr_staff':
        bgColor = '#d1ecf1';
        textColor = '#0c5460';
        text = '✓ HR Staff Approved';
        break;
      case 'approved_by_hr_head':
        bgColor = '#d1ecf1';
        textColor = '#0c5460';
        text = '✓ HR Head Approved';
        break;
      case 'approved':
        bgColor = '#d4edda';
        textColor = '#155724';
        text = '✓ Fully Approved';
        break;
      case 'rejected':
        bgColor = '#f8d7da';
        textColor = '#721c24';
        text = '✗ Rejected';
        break;
      default:
        bgColor = '#f5f5f5';
        textColor = '#333';
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
      vacation: '#007bff',
      sick: '#dc3545',
      personal: '#ffc107',
      bereavement: '#6c757d',
      emergency: '#e83e8c',
      other: '#17a2b8',
    };
    return colors[type] || '#6c757d';
  };

  const stats = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  return (
    <div style={{ padding: '2rem' }}>
      {showLeaveForm && (
        <LeaveForm
          onClose={() => setShowLeaveForm(false)}
          onSuccess={() => {
            setShowLeaveForm(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>My Leave Requests</h2>
          <p>View and manage your leave requests</p>
        </div>
        <button
          onClick={() => setShowLeaveForm(true)}
          disabled={leaveBalance === 0}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: leaveBalance === 0 ? '#ccc' : '#007bff',
            color: leaveBalance === 0 ? '#999' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: leaveBalance === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
          title={leaveBalance === 0 ? 'No leave balance available' : ''}
        >
          {leaveBalance === 0 ? '❌ No Leave Available' : '➕ Request Leave'}
        </button>
      </div>

      {/* Statistics */}
      <div className="stats-grid" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="stat-card" style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>📋</div>
            <div>
              <h3 style={{ margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.pending}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Pending</p>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>✓</div>
            <div>
              <h3 style={{ margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.approved}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Approved</p>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>✗</div>
            <div>
              <h3 style={{ margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.rejected}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ marginRight: '1rem', fontWeight: 'bold' }}>Filter by Status:</label>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved_by_supervisor">Supervisor Approved</option>
          <option value="approved_by_hr_staff">HR Staff Approved</option>
          <option value="approved_by_hr_head">HR Head Approved</option>
          <option value="approved">Fully Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8d7da', borderRadius: '4px' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : leaves.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: '#f5f5f5' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Leave Type</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Duration</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Days</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Reason</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave._id} style={{ borderBottom: '1px solid #eee' }}>
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
                    {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
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
        <div className="empty-state" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          <p>No leave requests found.</p>
        </div>
      )}
    </div>
  );
}

export default EmployeeLeave;
