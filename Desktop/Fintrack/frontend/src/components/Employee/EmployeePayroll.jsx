import React, { useState, useEffect } from 'react';

function EmployeePayroll() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Consolidated style objects using CSS variables
  const styles = {
    errorMessage: {
      color: 'var(--color-error)',
      padding: '1rem',
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: '4px',
      marginBottom: '1rem',
      border: '1px solid var(--color-error)',
    },
    infoCard: {
      padding: '1rem',
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: '6px',
      border: '1px solid var(--color-border)',
    },
    cardHeading: {
      margin: '0 0 0.5rem 0',
      fontSize: '0.9rem',
      color: 'var(--color-text-secondary)',
    },
    cardAmount: {
      margin: '0.5rem 0',
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: 'var(--color-primary)',
    },
    cardDate: {
      margin: '0.5rem 0',
      fontSize: '0.85rem',
      color: 'var(--color-text-secondary)',
    },
    emptyMessage: {
      padding: '2rem',
      textAlign: 'center',
      color: 'var(--color-text-secondary)',
    },
    tableHead: {
      backgroundColor: 'var(--color-bg-secondary)',
      borderBottom: '2px solid var(--color-border)',
    },
    tableHeading: {
      padding: '0.75rem',
      textAlign: 'left',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: 'var(--color-text)',
    },
    tableHeadingRight: {
      padding: '0.75rem',
      textAlign: 'right',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: 'var(--color-text)',
    },
    tableHeadingCenter: {
      padding: '0.75rem',
      textAlign: 'center',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: 'var(--color-text)',
    },
    tableRow: {
      borderBottom: '1px solid var(--color-border)',
      color: 'var(--color-text)',
    },
    tableCell: {
      padding: '0.75rem',
      fontSize: '0.9rem',
    },
    tableCellRight: {
      padding: '0.75rem',
      textAlign: 'right',
      fontSize: '0.9rem',
    },
    statusBadge: {
      padding: '0.25rem 0.5rem',
      backgroundColor: 'var(--color-success)',
      color: 'white',
      borderRadius: '3px',
      fontSize: '0.85rem',
    },
    viewButton: {
      padding: '0.4rem 0.8rem',
      marginRight: '0.5rem',
      backgroundColor: 'var(--color-primary)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem',
    },
    downloadButton: {
      padding: '0.4rem 0.8rem',
      backgroundColor: 'var(--color-success)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'var(--color-bg)',
      padding: '2rem',
      borderRadius: '8px',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflowY: 'auto',
      position: 'relative',
      color: 'var(--color-text)',
    },
    closeButton: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      border: 'none',
      backgroundColor: 'transparent',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: 'var(--color-text)',
    },
    sectionHeading: {
      borderBottom: '2px solid var(--color-primary)',
      paddingBottom: '0.5rem',
      marginBottom: '1rem',
      color: 'var(--color-text)',
    },
    deductionHeading: {
      borderBottom: '2px solid var(--color-error)',
      paddingBottom: '0.5rem',
      marginBottom: '1rem',
      color: 'var(--color-text)',
    },
    summaryHeading: {
      borderBottom: '2px solid var(--color-accent)',
      paddingBottom: '0.5rem',
      marginBottom: '1rem',
      color: 'var(--color-text)',
    },
    netPaySummary: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: 'var(--color-primary)',
    },
    grossPayLine: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: 'var(--color-success)',
      borderTop: '1px solid var(--color-border)',
      paddingTop: '0.5rem',
      marginTop: '0.5rem',
    },
    deductionLine: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: 'var(--color-error)',
      borderTop: '1px solid var(--color-border)',
      paddingTop: '0.5rem',
      marginTop: '0.5rem',
    },
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payroll/payslips/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch payslips');

      const data = await response.json();
      setPayslips(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching payslips:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = async (payslipId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/payroll/payslips/${payslipId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch payslip details');

      const data = await response.json();
      setSelectedPayslip(data.data);
    } catch (err) {
      console.error('Error fetching payslip:', err);
      setError(err.message);
    }
  };

  const handleDownloadPDF = async (payslipId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/payroll/payslips/${payslipId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to download PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err.message);
    }
  };

  if (loading) return <div className="payroll-section"><p>Loading payslips...</p></div>;

  const lastPayslip = payslips[0];
  const ytdEarnings = payslips.reduce((sum, p) => sum + (p.earnings?.grossPay || 0), 0);

  return (
    <div className="payroll-section">
      <div className="section-header">
        <h2>💰 Payroll Information</h2>
        <p>View your salary and payment history</p>
      </div>

      {error && <div className="error-message" style={styles.errorMessage}>Error: {error}</div>}

      {lastPayslip && (
        <div className="payroll-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="info-card" style={styles.infoCard}>
            <h3 style={styles.cardHeading}>Last Salary</h3>
            <p className="amount" style={styles.cardAmount}>₱ {(lastPayslip.earnings?.netPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            <p className="date" style={styles.cardDate}>Period: {lastPayslip.payrollPeriod?.periodStartDate?.split('T')[0]} to {lastPayslip.payrollPeriod?.periodEndDate?.split('T')[0]}</p>
          </div>

          <div className="info-card" style={styles.infoCard}>
            <h3 style={styles.cardHeading}>Gross Pay</h3>
            <p className="amount" style={styles.cardAmount}>₱ {(lastPayslip.earnings?.grossPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            <p className="date" style={styles.cardDate}>Including all allowances & premiums</p>
          </div>

          <div className="info-card" style={styles.infoCard}>
            <h3 style={styles.cardHeading}>Year-to-Date Earnings</h3>
            <p className="amount" style={styles.cardAmount}>₱ {ytdEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            <p className="date" style={styles.cardDate}>{payslips.length} payslip(s)</p>
          </div>
        </div>
      )}

      <div className="payroll-history">
        <h3>Payment History</h3>
        {payslips.length === 0 ? (
          <p style={styles.emptyMessage}>No payslips available yet.</p>
        ) : (
          <div className="history-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={styles.tableHead}>
                  <th style={styles.tableHeading}>Period</th>
                  <th style={styles.tableHeadingRight}>Gross Pay</th>
                  <th style={styles.tableHeadingRight}>Deductions</th>
                  <th style={styles.tableHeadingRight}>Net Pay</th>
                  <th style={styles.tableHeadingCenter}>Status</th>
                  <th style={styles.tableHeadingCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(payslip => (
                  <tr key={payslip._id} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      {payslip.payrollPeriod?.periodStartDate?.split('T')[0]} to {payslip.payrollPeriod?.periodEndDate?.split('T')[0]}
                    </td>
                    <td style={styles.tableCellRight}>₱ {(payslip.earnings?.grossPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td style={styles.tableCellRight}>₱ {(payslip.deductions?.totalDeductions || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td style={styles.tableCellRight}>₱ {(payslip.netPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td style={{ ...styles.tableCell, textAlign: 'center' }}><span style={styles.statusBadge}>{payslip.status}</span></td>
                    <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                      <button 
                        className="action-btn view" 
                        onClick={() => handleViewPayslip(payslip._id)}
                        style={styles.viewButton}
                      >
                        View
                      </button>
                      <button 
                        className="action-btn download" 
                        onClick={() => handleDownloadPDF(payslip._id)}
                        style={styles.downloadButton}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayslip && (
        <div className="payslip-detail-modal" style={styles.modalOverlay}>
          <div className="modal-content" style={styles.modalContent}>
            <button 
              className="close-btn" 
              onClick={() => setSelectedPayslip(null)}
              style={styles.closeButton}
            >
              ✕
            </button>
            <h2 style={{ marginTop: 0, color: 'var(--color-text)' }}>Payslip Details</h2>
            
            <div className="payslip-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              <div className="payslip-section">
                <h3 style={styles.sectionHeading}>Earnings</h3>
                <p style={{ color: 'var(--color-text)' }}><strong>Basic Salary:</strong> ₱ {(selectedPayslip.earnings?.basicSalary || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={{ color: 'var(--color-text)' }}><strong>Overtime:</strong> ₱ {(selectedPayslip.earnings?.overtimePay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={{ color: 'var(--color-text)' }}><strong>Night Differential:</strong> ₱ {(selectedPayslip.earnings?.nightDifferential || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={{ color: 'var(--color-text)' }}><strong>Holiday Pay:</strong> ₱ {(selectedPayslip.earnings?.holidayPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={{ color: 'var(--color-text)' }}><strong>Allowances:</strong> ₱ {(selectedPayslip.earnings?.allowances || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={styles.grossPayLine}><strong>Gross Pay:</strong> ₱ {(selectedPayslip.earnings?.grossPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="payslip-section">
                <h3 style={styles.deductionHeading}>Deductions</h3>
                <p style={{ color: 'var(--color-text)' }}><strong>SSS:</strong> ₱ {(selectedPayslip.deductions?.sssContribution || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={{ color: 'var(--color-text)' }}><strong>PhilHealth:</strong> ₱ {(selectedPayslip.deductions?.philhealthContribution || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={{ color: 'var(--color-text)' }}><strong>Pag-IBIG:</strong> ₱ {(selectedPayslip.deductions?.pagibigContribution || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={{ color: 'var(--color-text)' }}><strong>Withholding Tax:</strong> ₱ {(selectedPayslip.deductions?.withholdinTax || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={styles.deductionLine}><strong>Total Deductions:</strong> ₱ {(selectedPayslip.deductions?.totalDeductions || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="payslip-section summary" style={{ gridColumn: '1 / -1' }}>
                <h3 style={styles.summaryHeading}>Summary</h3>
                <p style={styles.netPaySummary}><strong>Net Pay:</strong> ₱ {(selectedPayslip.netPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p style={{ color: 'var(--color-text)' }}><strong>Status:</strong> {selectedPayslip.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeePayroll;
