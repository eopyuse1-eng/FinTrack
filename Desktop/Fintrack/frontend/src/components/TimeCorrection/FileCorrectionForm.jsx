import React, { useState, useEffect } from 'react';
import '../styles/TimeCorrection.css';

const FileCorrectionForm = ({ onClose, attendanceRecord, onSuccess }) => {
  const [formData, setFormData] = useState({
    correctedCheckInTime: '',
    correctedCheckOutTime: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill with original times
  useEffect(() => {
    if (attendanceRecord) {
      const checkInTime = new Date(attendanceRecord.checkInTime);
      const checkOutTime = new Date(attendanceRecord.checkOutTime);
      
      setFormData(prev => ({
        ...prev,
        correctedCheckInTime: checkInTime.toISOString().slice(0, 16),
        correctedCheckOutTime: checkOutTime ? checkOutTime.toISOString().slice(0, 16) : '',
      }));
    }
  }, [attendanceRecord]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      setError('Please provide a reason for the correction');
      return;
    }

    if (!formData.correctedCheckInTime || !formData.correctedCheckOutTime) {
      setError('Both check-in and check-out times are required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-correction/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attendanceId: attendanceRecord._id,
          correctedCheckInTime: new Date(formData.correctedCheckInTime).toISOString(),
          correctedCheckOutTime: new Date(formData.correctedCheckOutTime).toISOString(),
          reason: formData.reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit correction');
      }

      setSuccess('Time correction request submitted successfully');
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

  if (!attendanceRecord) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>File Time Correction</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Original Times</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Check-in Time</label>
                  <input
                    type="text"
                    value={new Date(attendanceRecord.checkInTime).toLocaleString()}
                    disabled
                    className="input-readonly"
                  />
                </div>
                <div className="form-group">
                  <label>Check-out Time</label>
                  <input
                    type="text"
                    value={attendanceRecord.checkOutTime ? new Date(attendanceRecord.checkOutTime).toLocaleString() : 'Not checked out'}
                    disabled
                    className="input-readonly"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Corrected Times</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Corrected Check-in Time *</label>
                  <input
                    type="datetime-local"
                    name="correctedCheckInTime"
                    value={formData.correctedCheckInTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Corrected Check-out Time *</label>
                  <input
                    type="datetime-local"
                    name="correctedCheckOutTime"
                    value={formData.correctedCheckOutTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Reason for Correction *</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Please explain why this time correction is needed..."
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
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FileCorrectionForm;
