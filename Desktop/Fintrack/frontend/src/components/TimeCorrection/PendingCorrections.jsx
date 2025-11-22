import React, { useState, useEffect } from 'react';
import '../styles/TimeCorrection.css';

const PendingCorrections = ({ userRole }) => {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'

  useEffect(() => {
    fetchPendingCorrections();
  }, []);

  const fetchPendingCorrections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-correction/pending-approvals', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch pending corrections');
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

  const handleApprove = (correction) => {
    setSelectedCorrection(correction);
    setApprovalAction('approve');
    setShowApprovalModal(true);
  };

  const handleReject = (correction) => {
    setSelectedCorrection(correction);
    setApprovalAction('reject');
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    if (!selectedCorrection) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = approvalAction === 'approve' 
        ? `/api/time-correction/${selectedCorrection._id}/approve`
        : `/api/time-correction/${selectedCorrection._id}/reject`;

      const body = approvalAction === 'approve'
        ? { comments: approvalComments }
        : { rejectionReason };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process correction');
      }

      // Refresh the pending corrections list to remove approved/rejected items
      fetchPendingCorrections();

      setShowApprovalModal(false);
      setSelectedCorrection(null);
      setApprovalComments('');
      setRejectionReason('');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const getApprovalStatusBadge = (correction) => {
    const getStatusDisplay = (status) => {
      if (status === 'pending') return 'Pending';
      if (status === 'approved_by_hr_staff') return '✓ HR Staff Approved';
      if (status === 'approved_by_hr_head') return '✓ HR Head Approved';
      if (status === 'approved_by_supervisor') return '✓ Supervisor Approved';
      if (status === 'approved') return '✓ Fully Approved';
      if (status === 'rejected') return '✗ Rejected';
      return status.charAt(0).toUpperCase() + status.slice(1);
    };
    const statusClass = `badge badge-${correction.status}`;
    return <span className={statusClass}>{getStatusDisplay(correction.status)}</span>;
  };

  const getApprovalLevelText = (correction) => {
    return `Level ${correction.currentApprovalLevel + 1}/${correction.totalApprovalsRequired}`;
  };

  if (loading) {
    return <div className="loading">Loading pending corrections...</div>;
  }

  return (
    <div className="pending-corrections-container">
      <div className="pending-header">
        <h2>Pending Time Corrections</h2>
        <button className="button button-secondary" onClick={fetchPendingCorrections}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {corrections.length === 0 ? (
        <div className="empty-state">
          <p>No pending time corrections to approve</p>
        </div>
      ) : (
        <div className="corrections-table-wrapper">
          <table className="corrections-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Original Time</th>
                <th>Corrected Time</th>
                <th>Status</th>
                <th>Approval Level</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map(correction => (
                <tr key={correction._id}>
                  <td className="employee-name">
                    {correction.employee?.firstName} {correction.employee?.lastName}
                  </td>
                  <td>{correction.department}</td>
                  <td className="time-cell">
                    {new Date(correction.originalCheckInTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} - {new Date(correction.originalCheckOutTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="time-cell">
                    <strong>
                      {new Date(correction.correctedCheckInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} - {new Date(correction.correctedCheckOutTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </td>
                  <td>{getApprovalStatusBadge(correction)}</td>
                  <td className="approval-level">{getApprovalLevelText(correction)}</td>
                  <td className="reason-cell">{correction.reason}</td>
                  <td className="actions-cell">
                    {correction.status === 'pending' && (
                      <div className="button-group">
                        <button
                          className="button button-sm button-success"
                          onClick={() => handleApprove(correction)}
                          title="Approve this time correction"
                        >
                          Approve
                        </button>
                        <button
                          className="button button-sm button-danger"
                          onClick={() => handleReject(correction)}
                          title="Reject this time correction"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showApprovalModal && selectedCorrection && (
        <div className="modal-overlay">
          <div className="modal-content modal-approval">
            <div className="modal-header">
              <h2>
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Time Correction
              </h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedCorrection(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="correction-summary">
                <h3>Correction Details</h3>
                <p>
                  <strong>Employee:</strong> {selectedCorrection.employee?.firstName}{' '}
                  {selectedCorrection.employee?.lastName}
                </p>
                <p>
                  <strong>Original Time:</strong>{' '}
                  {new Date(selectedCorrection.originalCheckInTime).toLocaleTimeString()} -{' '}
                  {new Date(selectedCorrection.originalCheckOutTime).toLocaleTimeString()}
                </p>
                <p>
                  <strong>Corrected Time:</strong>{' '}
                  {new Date(selectedCorrection.correctedCheckInTime).toLocaleTimeString()} -{' '}
                  {new Date(selectedCorrection.correctedCheckOutTime).toLocaleTimeString()}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedCorrection.reason}
                </p>
              </div>

              <div className="form-group">
                <label>
                  {approvalAction === 'approve' ? 'Approval Comments' : 'Rejection Reason'} *
                </label>
                <textarea
                  value={approvalAction === 'approve' ? approvalComments : rejectionReason}
                  onChange={(e) =>
                    approvalAction === 'approve'
                      ? setApprovalComments(e.target.value)
                      : setRejectionReason(e.target.value)
                  }
                  placeholder={
                    approvalAction === 'approve'
                      ? 'Enter approval comments (optional)...'
                      : 'Please provide a reason for rejection...'
                  }
                  rows="3"
                  required={approvalAction === 'reject'}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="button button-secondary"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedCorrection(null);
                }}
              >
                Cancel
              </button>
              <button
                className={`button ${
                  approvalAction === 'approve'
                    ? 'button-success'
                    : 'button-danger'
                }`}
                onClick={submitApproval}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingCorrections;
