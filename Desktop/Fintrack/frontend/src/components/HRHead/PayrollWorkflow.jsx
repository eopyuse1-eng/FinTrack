import React, { useState, useEffect } from 'react';
import '../../styles/Dashboards.css';

function PayrollWorkflow() {
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState({
    initialize: false,
    compute: false,
    lock: false,
    generatePayslips: false,
  });

  useEffect(() => {
    fetchPayrollPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchPayrollRecords(selectedPeriod._id);
      updateWorkflowStatus(selectedPeriod);
    }
  }, [selectedPeriod]);

  const updateWorkflowStatus = (period) => {
    if (!period) return;
    setWorkflowStatus({
      initialize: period.status !== 'pending_computation' && period.status !== 'pending',
      compute: period.status === 'computation_completed' || period.status === 'locked' || period.status === 'payroll_run',
      lock: period.status === 'locked' || period.status === 'payroll_run',
      generatePayslips: period.status === 'payroll_run',
    });
  };

  const fetchPayrollPeriods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payroll/periods', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPayrollPeriods(data.data);
          if (data.data.length > 0) {
            setSelectedPeriod(data.data[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching payroll periods:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollRecords = async (periodId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/payroll/${periodId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPayrollRecords(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching payroll records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!selectedPeriod) {
      alert('Please select a payroll period');
      return;
    }

    if (confirm(`🔒 Lock payroll period for ${selectedPeriod.periodName}?\n\nNote: All records must be approved first.`)) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/payroll/${selectedPeriod._id}/lock`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          alert('✓ Payroll period locked successfully');
          fetchPayrollRecords(selectedPeriod._id);
          updateWorkflowStatus({ ...selectedPeriod, status: 'locked' });
        } else {
          const error = await response.json();
          alert('⚠ Cannot lock payroll:\n' + error.message);
        }
      } catch (err) {
        console.error('Error processing payroll:', err);
        alert('Error locking payroll period');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGeneratePayslips = async () => {
    if (!selectedPeriod) {
      alert('Please select a payroll period');
      return;
    }

    if (confirm(`📄 Generate payslips for ${selectedPeriod.periodName}?\n\nNote: Period must be locked first.`)) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/payroll/${selectedPeriod._id}/generate-payslips`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          alert(`✓ Payslips generated successfully!\n${result.data?.generatedCount || ''} payslips created`);
          fetchPayrollRecords(selectedPeriod._id);
          updateWorkflowStatus({ ...selectedPeriod, status: 'completed' });
        } else {
          const error = await response.json();
          alert('⚠ Cannot generate payslips:\n' + error.message);
        }
      } catch (err) {
        console.error('Error generating payslips:', err);
        alert('Error generating payslips');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredRecords = payrollRecords.filter((record) =>
    `${record.employeeId?.firstName} ${record.employeeId?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employeeId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#fff3cd';
      case 'processed':
        return '#d4edda';
      case 'paid':
        return '#d1ecf1';
      default:
        return '#f5f5f5';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'pending':
        return '#856404';
      case 'processed':
        return '#155724';
      case 'paid':
        return '#0c5460';
      default:
        return '#333';
    }
  };

  const handleApproveAll = async () => {
    if (!selectedPeriod) {
      alert('Please select a payroll period');
      return;
    }

    if (confirm(`Approve all ${payrollRecords.length} payroll records for ${selectedPeriod.periodName}?`)) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        let approvedCount = 0;
        let skippedCount = 0;
        
        for (const record of payrollRecords) {
          if (record.status !== 'approved' && record.status !== 'locked') {
            const response = await fetch(`http://localhost:5000/api/payroll/${record._id}/approve`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              approvedCount++;
            }
          } else {
            skippedCount++;
          }
        }
        
        alert(`✓ Approved ${approvedCount} records${skippedCount > 0 ? `, skipped ${skippedCount} already approved` : ''}`);
        fetchPayrollRecords(selectedPeriod._id);
      } catch (err) {
        console.error('Error approving payroll records:', err);
        alert('Error approving payroll records');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div className="section-header">
        <h2>Payroll Workflow (HR Head)</h2>
        <p>Manage and process company-wide payroll</p>
      </div>

      {loading ? (
        <p>Loading payroll data...</p>
      ) : (
        <>
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}>
            <h3>Payroll Period Selection</h3>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={selectedPeriod?._id || ''}
                onChange={(e) => {
                  const period = payrollPeriods.find((p) => p._id === e.target.value);
                  setSelectedPeriod(period);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                  minWidth: '300px',
                }}
              >
                <option value="">Select a payroll period</option>
                {payrollPeriods.map((period) => (
                  <option key={period._id} value={period._id}>
                    {period.periodName} ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {selectedPeriod && (
              <>
                {/* Workflow Steps Visualization */}
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '2rem', 
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '2px solid #667eea',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>Payroll Processing Workflow</h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2rem' }}>
                    {/* Step 1: Initialize */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        margin: '0 auto 0.75rem',
                        borderRadius: '50%',
                        backgroundColor: workflowStatus.initialize ? '#28a745' : '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: workflowStatus.initialize ? 'white' : '#999',
                        fontWeight: 'bold',
                        border: workflowStatus.initialize ? '3px solid #20c997' : '2px solid #ddd'
                      }}>
                        {workflowStatus.initialize ? '✓' : '1'}
                      </div>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#333' }}>Initialize</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>Create payroll records</p>
                    </div>

                    {/* Connector 1 */}
                    <div style={{
                      flex: 0.5,
                      height: '3px',
                      backgroundColor: workflowStatus.initialize ? '#28a745' : '#e9ecef',
                      margin: '0 -10px 20px'
                    }} />

                    {/* Step 2: Compute */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        margin: '0 auto 0.75rem',
                        borderRadius: '50%',
                        backgroundColor: workflowStatus.compute ? '#28a745' : '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: workflowStatus.compute ? 'white' : '#999',
                        fontWeight: 'bold',
                        border: workflowStatus.compute ? '3px solid #20c997' : '2px solid #ddd'
                      }}>
                        {workflowStatus.compute ? '✓' : '2'}
                      </div>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#333' }}>Compute</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>Calculate salaries</p>
                    </div>

                    {/* Connector 2 */}
                    <div style={{
                      flex: 0.5,
                      height: '3px',
                      backgroundColor: workflowStatus.compute ? '#28a745' : '#e9ecef',
                      margin: '0 -10px 20px'
                    }} />

                    {/* Step 3: Lock */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        margin: '0 auto 0.75rem',
                        borderRadius: '50%',
                        backgroundColor: workflowStatus.lock ? '#28a745' : '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: workflowStatus.lock ? 'white' : '#999',
                        fontWeight: 'bold',
                        border: workflowStatus.lock ? '3px solid #20c997' : '2px solid #ddd'
                      }}>
                        {workflowStatus.lock ? '✓' : '3'}
                      </div>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#333' }}>Lock</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>Finalize payroll</p>
                    </div>

                    {/* Connector 3 */}
                    <div style={{
                      flex: 0.5,
                      height: '3px',
                      backgroundColor: workflowStatus.lock ? '#28a745' : '#e9ecef',
                      margin: '0 -10px 20px'
                    }} />

                    {/* Step 4: Generate Payslips */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        margin: '0 auto 0.75rem',
                        borderRadius: '50%',
                        backgroundColor: workflowStatus.generatePayslips ? '#28a745' : '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: workflowStatus.generatePayslips ? 'white' : '#999',
                        fontWeight: 'bold',
                        border: workflowStatus.generatePayslips ? '3px solid #20c997' : '2px solid #ddd'
                      }}>
                        {workflowStatus.generatePayslips ? '✓' : '4'}
                      </div>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#333' }}>Generate</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>Create payslips</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>Actions</h4>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleApproveAll}
                      disabled={workflowStatus.compute === false || payrollRecords.length === 0}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: workflowStatus.compute === false ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: workflowStatus.compute === false ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                      }}
                    >
                      ✓ Approve All Records
                    </button>

                    <button
                      onClick={handleProcessPayroll}
                      disabled={workflowStatus.lock === true || payrollRecords.length === 0}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: workflowStatus.lock === true ? '#ccc' : '#ffc107',
                        color: workflowStatus.lock === true ? '#999' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: workflowStatus.lock === true ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                      }}
                    >
                      🔒 Lock Period
                    </button>

                    <button
                      onClick={handleGeneratePayslips}
                      disabled={workflowStatus.lock === false || payrollRecords.length === 0}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: workflowStatus.lock === false || payrollRecords.length === 0 ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: workflowStatus.lock === false || payrollRecords.length === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                      }}
                    >
                      📄 Generate Payslips
                    </button>
                  </div>
                </div>

              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PayrollWorkflow;
