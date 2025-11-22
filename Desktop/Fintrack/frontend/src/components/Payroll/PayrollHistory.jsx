import React, { useState, useEffect } from 'react';

function PayrollHistory() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/payroll/payslips/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payslips');
      }

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

  const handleViewDetails = (payslip) => {
    setSelectedPayslip(payslip);
  };

  const handleCloseDetails = () => {
    setSelectedPayslip(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading payroll history...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>📄 Payroll History</h2>
        <p>View your payslips and earnings history</p>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p>Error: {error}</p>
          <button onClick={fetchPayslips} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {payslips.length === 0 && !error ? (
        <div style={styles.emptyState}>
          <p>No payslips available yet</p>
        </div>
      ) : (
        <div style={styles.payslipsList}>
          {payslips.map((payslip) => (
            <div key={payslip._id} style={styles.payslipCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.periodName}>
                    {payslip.periodInfo?.periodName || 'N/A'}
                  </h3>
                  <p style={styles.period}>
                    {formatDate(payslip.periodInfo?.startDate)} - {formatDate(payslip.periodInfo?.endDate)}
                  </p>
                </div>
                <div style={styles.statusBadge}>
                  {payslip.status}
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.earnings}>
                  <span style={styles.label}>Gross Pay:</span>
                  <span style={styles.amount}>
                    {formatCurrency(payslip.earnings?.grossPay)}
                  </span>
                </div>

                <div style={styles.deductions}>
                  <span style={styles.label}>Total Deductions:</span>
                  <span style={styles.amount}>
                    -{formatCurrency(payslip.deductions?.totalDeductions)}
                  </span>
                </div>

                <div style={styles.netPay}>
                  <span style={styles.label}>Net Pay:</span>
                  <span style={styles.netAmount}>
                    {formatCurrency(payslip.netPay)}
                  </span>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <button
                  style={styles.detailsBtn}
                  onClick={() => handleViewDetails(payslip)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payslip Details Modal */}
      {selectedPayslip && (
        <div style={styles.modalOverlay} onClick={handleCloseDetails}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>{selectedPayslip.periodInfo?.periodName} - Payslip Details</h3>
              <button style={styles.closeBtn} onClick={handleCloseDetails}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Employee Details */}
              <section style={styles.section}>
                <h4 style={styles.sectionTitle}>Employee Information</h4>
                <div style={styles.grid}>
                  <div>
                    <span style={styles.fieldLabel}>Name:</span>
                    <p>
                      {selectedPayslip.employeeDetails?.firstName}{' '}
                      {selectedPayslip.employeeDetails?.lastName}
                    </p>
                  </div>
                  <div>
                    <span style={styles.fieldLabel}>Department:</span>
                    <p>{selectedPayslip.employeeDetails?.department}</p>
                  </div>
                  <div>
                    <span style={styles.fieldLabel}>Position:</span>
                    <p>{selectedPayslip.employeeDetails?.position}</p>
                  </div>
                </div>
              </section>

              {/* Computation Summary */}
              <section style={styles.section}>
                <h4 style={styles.sectionTitle}>Attendance Summary</h4>
                <div style={styles.grid}>
                  <div>
                    <span style={styles.fieldLabel}>Work Days:</span>
                    <p>{selectedPayslip.computationSummary?.workDays}</p>
                  </div>
                  <div>
                    <span style={styles.fieldLabel}>Present:</span>
                    <p>{selectedPayslip.computationSummary?.presentDays}</p>
                  </div>
                  <div>
                    <span style={styles.fieldLabel}>Absent:</span>
                    <p>{selectedPayslip.computationSummary?.absenceDays}</p>
                  </div>
                </div>
              </section>

              {/* Earnings Breakdown */}
              <section style={styles.section}>
                <h4 style={styles.sectionTitle}>Earnings Breakdown</h4>
                <div style={styles.breakdown}>
                  <div style={styles.breakdownItem}>
                    <span>Basic Salary:</span>
                    <span>{formatCurrency(selectedPayslip.earnings?.basicSalary)}</span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span>Overtime Pay:</span>
                    <span>{formatCurrency(selectedPayslip.earnings?.overtimePay)}</span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span>Allowances:</span>
                    <span>{formatCurrency(selectedPayslip.earnings?.allowances)}</span>
                  </div>
                  <div style={{ ...styles.breakdownItem, borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px', fontWeight: 'bold' }}>
                    <span>Gross Pay:</span>
                    <span>{formatCurrency(selectedPayslip.earnings?.grossPay)}</span>
                  </div>
                </div>
              </section>

              {/* Deductions Breakdown */}
              <section style={styles.section}>
                <h4 style={styles.sectionTitle}>Deductions Breakdown</h4>
                <div style={styles.breakdown}>
                  <div style={styles.breakdownItem}>
                    <span>SSS Contribution:</span>
                    <span>{formatCurrency(selectedPayslip.deductions?.sssContribution)}</span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span>PhilHealth:</span>
                    <span>{formatCurrency(selectedPayslip.deductions?.philhealthContribution)}</span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span>PagIBIG:</span>
                    <span>{formatCurrency(selectedPayslip.deductions?.pagibigContribution)}</span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span>Withholding Tax:</span>
                    <span>{formatCurrency(selectedPayslip.deductions?.withholdinTax)}</span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span>Late Deduction:</span>
                    <span>{formatCurrency(selectedPayslip.deductions?.lateDeduction)}</span>
                  </div>
                  <div style={{ ...styles.breakdownItem, borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px', fontWeight: 'bold' }}>
                    <span>Total Deductions:</span>
                    <span>{formatCurrency(selectedPayslip.deductions?.totalDeductions)}</span>
                  </div>
                </div>
              </section>

              {/* Final Computation */}
              <section style={styles.section}>
                <div style={styles.finalComputation}>
                  <div style={styles.computationRow}>
                    <span>Gross Pay:</span>
                    <span>{formatCurrency(selectedPayslip.earnings?.grossPay)}</span>
                  </div>
                  <div style={styles.computationRow}>
                    <span>Total Deductions:</span>
                    <span>-{formatCurrency(selectedPayslip.deductions?.totalDeductions)}</span>
                  </div>
                  <div style={styles.computationRowFinal}>
                    <span>NET PAY:</span>
                    <span>{formatCurrency(selectedPayslip.netPay)}</span>
                  </div>
                </div>
              </section>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.closeModalBtn} onClick={handleCloseDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: '8px',
  },
  header: {
    marginBottom: '2rem',
  },
  errorBox: {
    backgroundColor: 'var(--color-error)',
    border: '1px solid var(--color-error)',
    borderRadius: '4px',
    padding: '1rem',
    marginBottom: '1rem',
    color: 'white',
  },
  retryBtn: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--color-error)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--color-text-secondary)',
  },
  payslipsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '1.5rem',
  },
  payslipCard: {
    backgroundColor: 'var(--color-bg)',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    padding: '1rem',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodName: {
    margin: '0',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--color-text)',
  },
  period: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.9rem',
    color: 'var(--color-text-secondary)',
  },
  statusBadge: {
    padding: '0.4rem 0.8rem',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: 'white',
    textTransform: 'capitalize',
  },
  cardBody: {
    padding: '1rem',
    backgroundColor: 'var(--color-bg-secondary)',
  },
  earnings: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    fontSize: '0.95rem',
    color: 'var(--color-text)',
  },
  deductions: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    fontSize: '0.95rem',
    color: 'var(--color-error)',
  },
  netPay: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderTop: '2px solid var(--color-border)',
    marginTop: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--color-text)',
  },
  label: {
    color: 'var(--color-text-secondary)',
  },
  amount: {
    fontWeight: '500',
  },
  netAmount: {
    color: 'var(--color-success)',
  },
  cardFooter: {
    padding: '1rem',
    borderTop: '1px solid var(--color-border)',
    textAlign: 'right',
  },
  detailsBtn: {
    padding: '0.6rem 1.2rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--color-bg)',
    borderRadius: '8px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)',
  },
  modalBody: {
    padding: '1.5rem',
  },
  section: {
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: 'var(--color-text)',
    borderBottom: '2px solid var(--color-primary)',
    paddingBottom: '0.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
  },
  fieldLabel: {
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
    fontWeight: '500',
  },
  breakdown: {
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: '4px',
    padding: '1rem',
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    fontSize: '0.95rem',
    color: 'var(--color-text)',
  },
  finalComputation: {
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: '4px',
    padding: '1rem',
    border: '2px solid var(--color-primary)',
  },
  computationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    fontSize: '0.95rem',
    color: 'var(--color-text)',
  },
  computationRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderTop: '2px solid #0066cc',
    marginTop: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#0066cc',
  },
  modalFooter: {
    padding: '1rem',
    borderTop: '1px solid #eee',
    textAlign: 'right',
  },
  closeModalBtn: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};

export default PayrollHistory;
