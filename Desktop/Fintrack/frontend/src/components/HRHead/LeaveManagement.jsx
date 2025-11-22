import React, { useState, useEffect } from 'react';
import '../../styles/Dashboards.css';
import LeaveForm from '../Leave/LeaveForm';

function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [user, setUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      setUser(JSON.parse(userString));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingLeaves();
    } else if (activeTab === 'history') {
      fetchLeaveHistory();
    }
  }, [activeTab, refreshTrigger]);

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/leave/pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPendingLeaves(data.data || []);
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

  const fetchLeaveHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/leave/history`, {
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
        setError(data.message || 'Failed to fetch leave history');
      }
    } catch (err) {
      setError('Error fetching leave history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/leave/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approverComment: '' }),
      });

      const data = await response.json();
      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
        alert('Leave approved successfully');
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
      const response = await fetch(`http://localhost:5000/api/leave/${leaveId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approverComment: rejectionReason }),
      });

      const data = await response.json();
      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
        alert('Leave rejected successfully');
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
    pending: pendingLeaves.length,
    approved: leaves.filter(l => l.status === 'approved' || l.status?.includes('approved')).length,
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
          <h2>Leave Management (HR Head)</h2>
          <p>Review and manage company-wide leave requests</p>
        </div>
        <button
          onClick={() => setShowLeaveForm(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
        >
          ➕ Create Leave
        </button>
      </div>

      {/* Statistics */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ffc107' }}>📋</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#28a745' }}>✓</div>
          <div className="stat-content">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#dc3545' }}>✗</div>
          <div className="stat-content">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #ddd', display: 'flex', gap: '2rem' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '1rem 0',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
            color: activeTab === 'pending' ? '#007bff' : '#666',
            borderBottom: activeTab === 'pending' ? '3px solid #007bff' : 'none',
            marginBottom: '-2px',
          }}
        >
          📋 Pending Approvals
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '1rem 0',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            color: activeTab === 'history' ? '#007bff' : '#666',
            borderBottom: activeTab === 'history' ? '3px solid #007bff' : 'none',
            marginBottom: '-2px',
          }}
        >
          📚 Leave History
        </button>
      </div>

      {/* History Filter */}
      {activeTab === 'history' && (
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
      )}

      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8d7da', borderRadius: '4px' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : activeTab === 'pending' ? (
        // Pending Leaves
        <div>
          {pendingLeaves.length > 0 ? (
            pendingLeaves.map(leave => (
              <div key={leave._id} style={{
                backgroundColor: '#f9f9f9',
                borderLeft: '4px solid #ffc107',
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '4px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1rem' }}>
                  <div>
                    <p><strong>Employee:</strong> {leave.employeeId?.firstName} {leave.employeeId?.lastName}</p>
                    <p><strong>Email:</strong> {leave.employeeId?.email}</p>
                    <p><strong>Leave Type:</strong> <span style={{ backgroundColor: getLeaveTypeColor(leave.leaveType), color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>{leave.leaveType}</span></p>
                    <p><strong>Days:</strong> {leave.numberOfDays}</p>
                  </div>
                  <div>
                    <p><strong>From:</strong> {new Date(leave.startDate).toLocaleDateString()}</p>
                    <p><strong>To:</strong> {new Date(leave.endDate).toLocaleDateString()}</p>
                    <p><strong>Reason:</strong> {leave.reason?.substring(0, 80)}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  {getStatusBadge(leave.status)}

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
                        fontWeight: 'bold',
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              <p>No pending leave requests to approve.</p>
            </div>
          )}
        </div>
      ) : (
        // Leave History
        <div>
          {leaves.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Employee</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Duration</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Days</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(leave => (
                    <tr key={leave._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong>{leave.employeeId?.firstName} {leave.employeeId?.lastName}</strong>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ backgroundColor: getLeaveTypeColor(leave.leaveType), color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                          {leave.leaveType}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <strong>{leave.numberOfDays}</strong>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {getStatusBadge(leave.status)}
                      </td>
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
              <p>No leave history found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LeaveManagement;
