import React, { useState, useEffect } from 'react';
import './PayrollApproval.css';

/**
 * PAYROLL APPROVAL COMPONENT
 * HR Head approves payroll records and locks payroll period
 * 
 * Features:
 * - View all computed payroll records
 * - Approve/Reject individual records
 * - View payroll summary
 * - Lock payroll period
 * - Generate payslips
 */

function PayrollApproval() {
  const [activeTab, setActiveTab] = useState('approval');
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPayrollPeriods();
  }, []);

  const fetchPayrollPeriods = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/payroll/periods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPayrollPeriods(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching payroll periods:', err);
    }
  };

  const fetchPeriodData = async (periodId) => {
    try {
      setLoading(true);
      
      // Fetch payroll records
      const recordsResponse = await fetch(`http://localhost:5000/api/payroll/${periodId}?status=computed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch summary
      const summaryResponse = await fetch(`http://localhost:5000/api/payroll/${periodId}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        setPayrollRecords(recordsData.data || []);
      }

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData.data?.summary);
      }
    } catch (err) {
      setError('Error fetching payroll data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recordId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/payroll/${recordId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approvalNotes }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Payroll record approved');
        setApprovalNotes('');
        setSelectedRecord(null);
        if (selectedPeriod) fetchPeriodData(selectedPeriod._id);
      } else {
        setError(data.message || 'Error approving payroll');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (recordId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/payroll/${recordId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Payroll record rejected and sent back for recomputation');
        setRejectionReason('');
        setSelectedRecord(null);
        if (selectedPeriod) fetchPeriodData(selectedPeriod._id);
      } else {
        setError(data.message || 'Error rejecting payroll');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLockPeriod = async () => {
    if (!window.confirm('Lock this payroll period? No more changes will be allowed.')) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/payroll/${selectedPeriod._id}/lock`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Payroll period locked successfully');
        fetchPayrollPeriods();
        setSelectedPeriod(null);
      } else {
        setError(data.message || 'Error locking payroll');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayslips = async () => {
    if (!window.confirm('Generate payslips for this period?')) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/payroll/${selectedPeriod._id}/generate-payslips`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        fetchPayrollPeriods();
        if (selectedPeriod) fetchPeriodData(selectedPeriod._id);
      } else {
        setError(data.message || 'Error generating payslips');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payroll-approval-container">
      <h2>Payroll Approval & Processing</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'approval' ? 'active' : ''}`}
          onClick={() => setActiveTab('approval')}
        >
          Approve Records
        </button>
        <button
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
      </div>

      {/* Period Selection */}
      <div className="form-group">
        <label>Select Payroll Period</label>
        <select
          value={selectedPeriod ? selectedPeriod._id : ''}
          onChange={(e) => {
            const period = payrollPeriods.find((p) => p._id === e.target.value);
            setSelectedPeriod(period);
            if (period) fetchPeriodData(period._id);
          }}
        >
          <option value="">-- Select Period --</option>
          {payrollPeriods.map((period) => (
            <option key={period._id} value={period._id}>
              {period.periodName} ({period.status})
            </option>
          ))}
        </select>
      </div>

      {/* TAB 1: APPROVAL */}
      {activeTab === 'approval' && selectedPeriod && (
        <div className="tab-content">
          <h3>Approve Payroll Records</h3>

          {loading ? (
            <p>Loading...</p>
          ) : payrollRecords.length > 0 ? (
            <>
              <div className="records-table">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Gross Pay</th>
                      <th>Deductions</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRecords.map((record) => (
                      <tr key={record._id}>
                        <td>{record.employee?.firstName} {record.employee?.lastName}</td>
                        <td>₱{(record.earnings?.grossPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
                        <td>₱{(record.deductions?.totalDeductions || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
                        <td className="net-pay">₱{(record.netPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
                        <td><span className={`status-badge ${record.status}`}>{record.status}</span></td>
                        <td>
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="btn btn-small btn-info"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Period Actions */}
              <div className="period-actions">
                <button
                  onClick={handleGeneratePayslips}
                  disabled={loading}
                  className="btn btn-success"
                >
                  {loading ? 'Processing...' : 'Generate Payslips'}
                </button>
                <button
                  onClick={handleLockPeriod}
                  disabled={loading}
                  className="btn btn-warning"
                >
                  {loading ? 'Locking...' : 'Lock Period'}
                </button>
              </div>
            </>
          ) : (
            <p>No computed payroll records in this period</p>
          )}

          {/* Record Review Modal */}
          {selectedRecord && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h4>Review Payroll Record</h4>
                <button className="close-btn" onClick={() => setSelectedRecord(null)}>×</button>

                <div className="record-details">
                  <h5>{selectedRecord.employee?.firstName} {selectedRecord.employee?.lastName}</h5>

                  <div className="details-grid">
                    <div>
                      <strong>Gross Pay:</strong>
                      <p>₱{(selectedRecord.earnings?.grossPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <strong>SSS Contribution:</strong>
                      <p>₱{(selectedRecord.deductions?.sssContribution || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <strong>PhilHealth:</strong>
                      <p>₱{(selectedRecord.deductions?.philhealthContribution || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <strong>Pag-IBIG:</strong>
                      <p>₱{(selectedRecord.deductions?.pagibigContribution || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <strong>Withholding Tax:</strong>
                      <p>₱{(selectedRecord.deductions?.withholdinTax || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <strong>Total Deductions:</strong>
                      <p>₱{(selectedRecord.deductions?.totalDeductions || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="net-pay-display">
                    <strong>NET PAY:</strong>
                    <span className="amount">₱{(selectedRecord.netPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="form-group">
                    <label>Approval Notes</label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add any notes..."
                    />
                  </div>

                  <div className="button-group">
                    <button
                      onClick={() => handleApprove(selectedRecord._id)}
                      disabled={loading}
                      className="btn btn-success"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt('Rejection reason:');
                        if (reason) {
                          setRejectionReason(reason);
                          handleReject(selectedRecord._id);
                        }
                      }}
                      disabled={loading}
                      className="btn btn-danger"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUMMARY */}
      {activeTab === 'summary' && selectedPeriod && summary && (
        <div className="tab-content">
          <h3>Payroll Summary - {selectedPeriod.periodName}</h3>

          <div className="summary-grid">
            <div className="summary-card">
              <h4>Total Employees</h4>
              <p className="big-number">{summary.totalEmployees}</p>
            </div>

            <div className="summary-card">
              <h4>Total Gross Pay</h4>
              <p className="big-number">₱{summary.totalGrossPay.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
            </div>

            <div className="summary-card">
              <h4>Total Deductions</h4>
              <p className="big-number">₱{summary.totalDeductions.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
            </div>

            <div className="summary-card">
              <h4>Total Net Pay</h4>
              <p className="big-number">₱{summary.totalNetPay.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="deductions-breakdown">
            <h4>Government Contributions Breakdown</h4>
            <div className="breakdown-grid">
              <div>
                <strong>SSS:</strong>
                <p>₱{summary.totalSSS.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <strong>PhilHealth:</strong>
                <p>₱{summary.totalPhilHealth.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <strong>Pag-IBIG:</strong>
                <p>₱{summary.totalPagIBIG.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <strong>Income Tax:</strong>
                <p>₱{summary.totalTax.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="status-breakdown">
            <h4>Records by Status</h4>
            <div className="status-grid">
              <div><strong>Draft:</strong> {summary.recordsByStatus?.draft || 0}</div>
              <div><strong>Computed:</strong> {summary.recordsByStatus?.computed || 0}</div>
              <div><strong>Approved:</strong> {summary.recordsByStatus?.approved || 0}</div>
              <div><strong>Locked:</strong> {summary.recordsByStatus?.locked || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrollApproval;
