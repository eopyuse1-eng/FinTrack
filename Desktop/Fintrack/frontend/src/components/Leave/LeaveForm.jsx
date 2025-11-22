import React, { useState, useEffect } from 'react';
import '../styles/TimeCorrection.css';

const LeaveForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'vacation',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [leaveBalance, setLeaveBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    fetchLeaveBalance();
  }, []);

  const fetchLeaveBalance = async () => {
    try {
      setBalanceLoading(true);
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
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    let days = 0;
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // Count weekdays Monday-Saturday (1-6), exclude only Sunday (0)
      if (dayOfWeek !== 0) {
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      setError('Please provide a reason for the leave');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Both start and end dates are required');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/leave/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          leaveType: formData.leaveType,
          reason: formData.reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit leave request');
      }

      setSuccess('Leave request submitted successfully');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const daysCount = calculateDays();

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Request Leave</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#e7f3ff', borderRadius: '4px', borderLeft: '4px solid #007bff' }}>
            <strong>Available Leave Balance: {balanceLoading ? 'Loading...' : leaveBalance} days</strong>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Leave Type *</label>
                  <select
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleChange}
                    required
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="bereavement">Bereavement</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Leave Duration</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              {daysCount > 0 && (
                <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                  <strong>Total Days (excluding weekends):</strong> {daysCount} day(s)
                </p>
              )}
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Reason for Leave *</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Please explain the reason for your leave..."
                  rows="4"
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={loading || balanceLoading || leaveBalance === 0}
                title={leaveBalance === 0 ? 'No leave balance available' : ''}
              >
                {loading ? 'Submitting...' : leaveBalance === 0 ? 'No Leave Balance' : 'Submit Leave Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveForm;
