import React, { useState, useEffect } from 'react';
import './PayrollForm.css';

/**
 * PAYROLL FORM COMPONENT
 * HR Staff uses this to initialize payroll periods and compute payroll
 * 
 * Features:
 * - Initialize new payroll period
 * - View employees and their payroll status
 * - Compute individual employee payroll
 * - Add manual adjustments
 * - View computation summary
 */

function PayrollForm() {
  const [activeTab, setActiveTab] = useState('initialize'); // 'initialize' or 'compute'
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for initialize
  const [formData, setFormData] = useState({
    periodName: '',
    payrollCycle: 'monthly',
    startDate: '',
    endDate: '',
    attendanceCutoffStart: '',
    attendanceCutoffEnd: '',
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPayrollPeriods();
  }, []);

  const fetchPayrollPeriods = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/payroll', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Calculate totals for each period from its records
        const periodsWithTotals = await Promise.all(
          (data.data || []).map(async (period) => {
            try {
              const recordsResponse = await fetch(
                `http://localhost:5000/api/payroll/${period._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (recordsResponse.ok) {
                const recordsData = await recordsResponse.json();
                const records = recordsData.data || [];
                const totalGrossPay = records.reduce((sum, r) => sum + (r.earnings?.grossPay || 0), 0);
                const totalNetPay = records.reduce((sum, r) => sum + (r.netPay || 0), 0);
                return { ...period, totalGrossPay, totalNetPay };
              }
            } catch (err) {
              console.error(`Error fetching records for period ${period._id}:`, err);
            }
            return period;
          })
        );
        setPayrollPeriods(periodsWithTotals);
      }
    } catch (err) {
      console.error('Error fetching payroll periods:', err);
    }
  };

  const fetchPeriodEmployees = async (periodId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/payroll/${periodId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || []);
      }
    } catch (err) {
      setError('Error fetching employees: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInitializeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate dates
    if (!formData.periodName || !formData.startDate || !formData.endDate) {
      setError('Please fill in Period Name, Start Date, and End Date');
      return;
    }

    try {
      setLoading(true);
      
      // Convert dates to ISO format
      const startDate = new Date(formData.startDate).toISOString();
      const endDate = new Date(formData.endDate).toISOString();
      const attendanceCutoffStart = formData.attendanceCutoffStart 
        ? new Date(formData.attendanceCutoffStart).toISOString()
        : startDate;
      const attendanceCutoffEnd = formData.attendanceCutoffEnd
        ? new Date(formData.attendanceCutoffEnd).toISOString()
        : endDate;

      const payload = {
        periodName: formData.periodName,
        payrollCycle: formData.payrollCycle || 'monthly',
        startDate,
        endDate,
        attendanceCutoffStart,
        attendanceCutoffEnd,
      };

      console.log('Sending payload:', payload);

      const response = await fetch('http://localhost:5000/api/payroll/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Show warning if attendance data is missing
        if (data.warning) {
          setSuccess(data.message + '\n\n' + data.warning);
        } else {
          setSuccess(data.message);
        }
        setFormData({
          periodName: '',
          payrollCycle: 'monthly',
          startDate: '',
          endDate: '',
          attendanceCutoffStart: '',
          attendanceCutoffEnd: '',
        });
        fetchPayrollPeriods();
      } else {
        setError(data.message || 'Error initializing payroll');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComputeEmployee = async (employeeId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/payroll/${selectedPeriod._id}/${employeeId}/compute`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            computationNotes: `Computed by ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).firstName : 'HR Staff'}`,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Payroll computed for ${employeeId}`);
        fetchPeriodEmployees(selectedPeriod._id);
      } else {
        setError(data.message || 'Error computing payroll');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payroll-form-container">
      <h2>Payroll Management</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'initialize' ? 'active' : ''}`}
          onClick={() => setActiveTab('initialize')}
        >
          Initialize Payroll
        </button>
        <button
          className={`tab-button ${activeTab === 'compute' ? 'active' : ''}`}
          onClick={() => setActiveTab('compute')}
        >
          Compute Payroll
        </button>
      </div>

      {/* TAB 1: INITIALIZE */}
      {activeTab === 'initialize' && (
        <div className="tab-content">
          <div className="form-wrapper">
            <h3>Initialize New Payroll Period</h3>
            <form onSubmit={handleInitializeSubmit} className="payroll-form">
            <div className="form-row">
              <div className="form-group">
                <label>Period Name</label>
                <input
                  type="text"
                  name="periodName"
                  value={formData.periodName}
                  onChange={handleInitializeChange}
                  placeholder="e.g., January 2024"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payroll Cycle</label>
                <select name="payrollCycle" value={formData.payrollCycle} onChange={handleInitializeChange}>
                  <option value="monthly">Monthly</option>
                  <option value="semi_monthly">Semi-Monthly</option>
                  <option value="bi_weekly">Bi-Weekly</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInitializeChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInitializeChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Attendance Cutoff Start</label>
                <input
                  type="date"
                  name="attendanceCutoffStart"
                  value={formData.attendanceCutoffStart}
                  onChange={handleInitializeChange}
                />
              </div>

              <div className="form-group">
                <label>Attendance Cutoff End</label>
                <input
                  type="date"
                  name="attendanceCutoffEnd"
                  value={formData.attendanceCutoffEnd}
                  onChange={handleInitializeChange}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Initializing...' : 'Initialize Payroll Period'}
            </button>
            </form>
          </div>

          {/* Recent Payroll Periods */}
          <div className="payroll-periods">
            <h3>Recent Payroll Periods</h3>
            <div className="periods-list">
              {payrollPeriods.length > 0 ? (
                payrollPeriods.map((period) => (
                  <div key={period._id} className="period-card">
                    <h5>{period.periodName}</h5>
                    <p>Status: <span className={`status-badge ${period.status}`}>{period.status}</span></p>
                    <p>{period.totalEmployeesInPayroll || 0} employees</p>
                    <p>Total Gross: ₱{(period.totalGrossPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                    {period.status === 'pending_computation' && (
                      <button
                        className="btn btn-success"
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const response = await fetch(
                              `http://localhost:5000/api/payroll/${period._id}/compute-all`,
                              {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                              }
                            );
                            const data = await response.json();
                            if (response.ok) {
                              setSuccess(`Computed payroll for ${data.data.computedCount} employees`);
                              fetchPayrollPeriods();
                            } else {
                              setError(data.message || 'Error computing payroll');
                            }
                          } catch (err) {
                            setError('Error: ' + err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? 'Computing...' : 'Compute All Salaries'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No payroll periods created yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPUTE */}
      {activeTab === 'compute' && (
        <div className="tab-content">
          <h3>Compute Employee Payroll</h3>

          <div className="form-group">
            <label>Select Payroll Period</label>
            <select
              value={selectedPeriod ? selectedPeriod._id : ''}
              onChange={(e) => {
                const period = payrollPeriods.find((p) => p._id === e.target.value);
                setSelectedPeriod(period);
                if (period) fetchPeriodEmployees(period._id);
              }}
            >
              <option value="">-- Select Period --</option>
              {payrollPeriods
                .filter((p) => p.status === 'pending_computation' || p.status === 'computation_completed')
                .map((period) => (
                  <option key={period._id} value={period._id}>
                    {period.periodName} ({period.status})
                  </option>
                ))}
            </select>
          </div>

          {selectedPeriod && (
            <div className="employees-table">
              <h4>Employees in {selectedPeriod.periodName}</h4>
              <p>
                <strong>Total Gross: ₱{(selectedPeriod.totalGrossPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</strong>
                {' | '}
                <strong>Total Net: ₱{(selectedPeriod.totalNetPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</strong>
              </p>
              {loading ? (
                <p>Loading...</p>
              ) : employees.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th>Gross Pay</th>
                      <th>Net Pay</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee._id}>
                        <td>{employee.employee.firstName} {employee.employee.lastName}</td>
                        <td>{employee.employee.position}</td>
                        <td><span className={`status-badge ${employee.status}`}>{employee.status}</span></td>
                        <td>₱{(employee.earnings?.grossPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
                        <td>₱{(employee.netPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
                        <td>
                          {employee.status === 'draft' || employee.status === 'computed' ? (
                            <button
                              onClick={() => handleComputeEmployee(employee.employee._id)}
                              disabled={loading}
                              className="btn btn-small btn-primary"
                            >
                              {loading ? 'Computing...' : 'Compute'}
                            </button>
                          ) : (
                            <span className="text-success">✓ Computed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No employees in this period</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PayrollForm;
