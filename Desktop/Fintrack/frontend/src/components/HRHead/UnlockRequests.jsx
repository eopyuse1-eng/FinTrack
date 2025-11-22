import React, { useState, useEffect } from 'react';
import '../../styles/Dashboards.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UnlockRequests = ({ userRole }) => {
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, denied, all
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [resetPassword, setResetPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'deny'

  useEffect(() => {
    // Get user role from localStorage or props
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role || userRole;
    
    console.log('User role:', role, 'Expected: hr_head');
    
    // Only HR_HEAD can view this (check both formats: hr_head and HR_HEAD)
    if (role !== 'hr_head' && role !== 'HR_HEAD') {
      setError('Access denied. Only HR Head can manage unlock requests.');
      return;
    }
    fetchUnlockRequests();
  }, [refreshTrigger, userRole]);

  const fetchUnlockRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/api/auth/unlock-requests`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      if (data.success) {
        setUnlockRequests(data.data || []);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch unlock requests');
      }
    } catch (err) {
      setError('Error fetching unlock requests: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setActionType('approve');
    setShowModal(true);
    setReviewComment('');
    setResetPassword(false);
  };

  const handleDenyClick = (request) => {
    setSelectedRequest(request);
    setActionType('deny');
    setShowModal(true);
    setReviewComment('');
  };

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/unlock/${selectedRequest._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: reviewComment,
          resetPassword: resetPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`✓ Account unlocked successfully.${resetPassword ? ' Temporary password sent to user.' : ''}`);
        if (resetPassword && data.tempPassword) {
          console.log('Temp password:', data.tempPassword);
          alert(`Temporary password to share with user: ${data.tempPassword}`);
        }
        setShowModal(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(data.message || 'Failed to approve unlock request');
      }
    } catch (err) {
      alert('Error processing unlock request');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDenySubmit = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/unlock/${selectedRequest._id}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: reviewComment,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('✗ Unlock request denied.');
        setShowModal(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(data.message || 'Failed to deny unlock request');
      }
    } catch (err) {
      alert('Error processing unlock request');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    let bgColor, textColor, text;

    switch (status) {
      case 'pending':
        bgColor = 'var(--color-warning)';
        textColor = 'white';
        text = '⏳ Pending';
        break;
      case 'approved':
        bgColor = 'var(--color-success)';
        textColor = 'white';
        text = '✓ Approved';
        break;
      case 'denied':
        bgColor = 'var(--color-error)';
        textColor = 'white';
        text = '✗ Denied';
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

  const filteredRequests = filter === 'all' 
    ? unlockRequests 
    : unlockRequests.filter(req => req.status === filter);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (error && unlockRequests.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-error)' }}>{error}</div>;
  }

  if (filteredRequests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
        <p>No unlock requests found.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: filter === 'all' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
            color: filter === 'all' ? 'white' : 'var(--color-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
        >
          All ({unlockRequests.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: filter === 'pending' ? 'var(--color-warning)' : 'var(--color-bg-secondary)',
            color: filter === 'pending' ? 'white' : 'var(--color-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
        >
          Pending ({unlockRequests.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: filter === 'approved' ? 'var(--color-success)' : 'var(--color-bg-secondary)',
            color: filter === 'approved' ? 'white' : 'var(--color-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
        >
          Approved ({unlockRequests.filter(r => r.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('denied')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: filter === 'denied' ? 'var(--color-error)' : 'var(--color-bg-secondary)',
            color: filter === 'denied' ? 'white' : 'var(--color-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
        >
          Denied ({unlockRequests.filter(r => r.status === 'denied').length})
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead style={{ backgroundColor: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>User</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Department</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Reason</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Requested</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => (
              <tr key={request._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>
                  <strong>{request.user.firstName} {request.user.lastName}</strong>
                  <br />
                  <small style={{ color: '#666' }}>{request.user.email}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ textTransform: 'capitalize' }}>
                    {request.user.department}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#666', maxWidth: '250px' }}>
                  {request.reason.substring(0, 100)}...
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                  {new Date(request.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>{getStatusBadge(request.status)}</td>
                <td style={{ padding: '1rem' }}>
                  {request.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleApproveClick(request)}
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
                        onClick={() => handleDenyClick(request)}
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
                        ✗ Deny
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>
                      {request.reviewedBy && request.reviewedAt && (
                        <>
                          By {request.reviewedBy.firstName} on{' '}
                          {new Date(request.reviewedAt).toLocaleDateString()}
                        </>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {showModal && selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'var(--color-bg)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--color-border)',
          }}>
            <h2 style={{ color: 'var(--color-text)', marginTop: 0 }}>
              {actionType === 'approve' ? '✓ Approve Unlock' : '✗ Deny Unlock'}
            </h2>

            <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '6px' }}>
              <p style={{ margin: '0.5rem 0', color: 'var(--color-text)' }}>
                <strong>User:</strong> {selectedRequest.user.firstName} {selectedRequest.user.lastName} ({selectedRequest.user.email})
              </p>
              <p style={{ margin: '0.5rem 0', color: 'var(--color-text)' }}>
                <strong>Reason:</strong> {selectedRequest.reason}
              </p>
              <p style={{ margin: '0.5rem 0', color: 'var(--color-text)' }}>
                <strong>Requested:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--color-text)' }}>
                Review Comment (optional):
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a comment about this review..."
                rows="3"
                maxLength="500"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              />
              <small style={{ color: 'var(--color-text-secondary)' }}>{reviewComment.length}/500</small>
            </div>

            {actionType === 'approve' && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="reset-password"
                  checked={resetPassword}
                  onChange={(e) => setResetPassword(e.target.checked)}
                  disabled={isProcessing}
                />
                <label htmlFor="reset-password" style={{ cursor: 'pointer', color: 'var(--color-text)' }}>
                  Reset user's password (temporary password will be generated)
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'approve' ? handleApproveSubmit : handleDenySubmit}
                disabled={isProcessing}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: actionType === 'approve' ? '#28a745' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                {isProcessing ? 'Processing...' : (actionType === 'approve' ? '✓ Approve' : '✗ Deny')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnlockRequests;
