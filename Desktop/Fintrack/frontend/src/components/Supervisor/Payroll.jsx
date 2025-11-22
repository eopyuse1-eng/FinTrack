import React, { useState, useEffect } from 'react';

function Payroll() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payroll/payslips/me', {
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
      const response = await fetch(`/api/payroll/payslips/${payslipId}`, {
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
      const response = await fetch(`/api/payroll/payslips/${payslipId}/pdf`, {
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
        <h2>Payroll Information</h2>
        <p>View your salary and payment history</p>
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      {lastPayslip && (
        <div className="payroll-cards">
          <div className="info-card">
            <h3>Last Salary</h3>
            <p className="amount">₱ {(lastPayslip.earnings?.netPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            <p className="date">Period: {lastPayslip.payrollPeriod?.periodStartDate?.split('T')[0]} to {lastPayslip.payrollPeriod?.periodEndDate?.split('T')[0]}</p>
          </div>

          <div className="info-card">
            <h3>Gross Pay</h3>
            <p className="amount">₱ {(lastPayslip.earnings?.grossPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            <p className="date">Including all allowances & premiums</p>
          </div>

          <div className="info-card">
            <h3>Year-to-Date Earnings</h3>
            <p className="amount">₱ {ytdEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            <p className="date">{payslips.length} payslip(s)</p>
          </div>
        </div>
      )}

      <div className="payroll-history">
        <h3>Payment History</h3>
        {payslips.length === 0 ? (
          <p>No payslips available yet.</p>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(payslip => (
                  <tr key={payslip._id}>
                    <td>
                      {payslip.payrollPeriod?.periodStartDate?.split('T')[0]} to {payslip.payrollPeriod?.periodEndDate?.split('T')[0]}
                    </td>
                    <td>₱ {(payslip.earnings?.grossPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td>₱ {(payslip.deductions?.totalDeductions || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td>₱ {(payslip.netPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td><span className={`status-badge ${payslip.status}`}>{payslip.status}</span></td>
                    <td>
                      <button className="action-btn view" onClick={() => handleViewPayslip(payslip._id)}>
                        View
                      </button>
                      <button className="action-btn download" onClick={() => handleDownloadPDF(payslip._id)}>
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
        <div className="payslip-detail-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedPayslip(null)}>✕</button>
            <h2>Payslip Details</h2>
            
            <div className="payslip-grid">
              <div className="payslip-section">
                <h3>Earnings</h3>
                <p><strong>Basic Salary:</strong> ₱ {(selectedPayslip.earnings?.basicSalary || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p><strong>Overtime:</strong> ₱ {(selectedPayslip.earnings?.overtimePay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p><strong>Night Differential:</strong> ₱ {(selectedPayslip.earnings?.nightDifferential || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p><strong>Holiday Pay:</strong> ₱ {(selectedPayslip.earnings?.holidayPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p><strong>Allowances:</strong> ₱ {(selectedPayslip.earnings?.allowances || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p className="total"><strong>Gross Pay:</strong> ₱ {(selectedPayslip.earnings?.grossPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="payslip-section">
                <h3>Deductions</h3>
                <p><strong>SSS:</strong> ₱ {(selectedPayslip.deductions?.sssContribution || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p><strong>PhilHealth:</strong> ₱ {(selectedPayslip.deductions?.philhealthContribution || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p><strong>Pag-IBIG:</strong> ₱ {(selectedPayslip.deductions?.pagibigContribution || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p><strong>Withholding Tax:</strong> ₱ {(selectedPayslip.deductions?.withholdinTax || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p className="total"><strong>Total Deductions:</strong> ₱ {(selectedPayslip.deductions?.totalDeductions || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="payslip-section summary">
                <h3>Summary</h3>
                <p className="net-pay"><strong>Net Pay:</strong> ₱ {(selectedPayslip.netPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p><strong>Status:</strong> {selectedPayslip.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payroll;
