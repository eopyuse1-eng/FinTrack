import React, { useState, useEffect } from 'react';
import './PayslipViewer.css';

/**
 * PAYSLIP VIEWER COMPONENT
 * Employees view and download their payslips
 * 
 * Features:
 * - List all payslips
 * - View detailed breakdown
 * - Download as PDF
 * - View historical payslips
 */

function PayslipViewer() {
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/payroll/payslips/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPayslips(data.data || []);
      } else {
        setError('Error fetching payslips');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = async (payslipId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/payroll/payslips/${payslipId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPayslip(data.data);
        setSuccess('Payslip opened');
      } else {
        setError('Error fetching payslip details');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (payslipId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/payroll/payslips/${payslipId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Generate PDF using jsPDF (requires library: npm install jspdf)
        // For now, we'll generate a simple printable version
        generateAndDownloadPDF(data.data);
        
        setSuccess('Payslip downloaded');
      } else {
        setError('Error downloading payslip');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAndDownloadPDF = (payslip) => {
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; }
          .payslip-title { font-size: 18px; font-weight: bold; margin-top: 10px; }
          .employee-info { margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .net-pay-row { font-size: 16px; font-weight: bold; background-color: #e8f5e9; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">FinTrack HRIS</div>
          <div class="payslip-title">PAYSLIP</div>
        </div>

        <div class="employee-info">
          <div class="info-row">
            <div><strong>Employee Name:</strong> ${payslip.employeeDetails?.firstName} ${payslip.employeeDetails?.lastName}</div>
            <div><strong>Period:</strong> ${payslip.periodInfo?.periodName}</div>
          </div>
          <div class="info-row">
            <div><strong>Position:</strong> ${payslip.employeeDetails?.position}</div>
            <div><strong>Department:</strong> ${payslip.employeeDetails?.department}</div>
          </div>
          <div class="info-row">
            <div><strong>SSS No.:</strong> ${payslip.employeeDetails?.sssNumber || 'N/A'}</div>
            <div><strong>PhilHealth No.:</strong> ${payslip.employeeDetails?.philhealthNumber || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div><strong>Pag-IBIG No.:</strong> ${payslip.employeeDetails?.pagibigNumber || 'N/A'}</div>
            <div><strong>TIN:</strong> ${payslip.employeeDetails?.tinNumber || 'N/A'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th colspan="2">EARNINGS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td style="text-align: right;">₱${(payslip.earnings?.basicSalary || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Overtime Pay</td>
              <td style="text-align: right;">₱${(payslip.earnings?.overtimePay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Night Differential</td>
              <td style="text-align: right;">₱${(payslip.earnings?.nightDifferentialPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Holiday Pay</td>
              <td style="text-align: right;">₱${(payslip.earnings?.holidayPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Paid Leave</td>
              <td style="text-align: right;">₱${(payslip.earnings?.paidLeavePay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Allowances</td>
              <td style="text-align: right;">₱${(payslip.earnings?.allowances || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>GROSS PAY</td>
              <td style="text-align: right;">₱${(payslip.earnings?.grossPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <table>
          <thead>
            <tr>
              <th colspan="2">DEDUCTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tardiness Deduction</td>
              <td style="text-align: right;">₱${(payslip.deductions?.lateDeduction || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Undertime Deduction</td>
              <td style="text-align: right;">₱${(payslip.deductions?.undertimeDeduction || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Absence Deduction</td>
              <td style="text-align: right;">₱${(payslip.deductions?.absenceDeduction || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>SSS Contribution</td>
              <td style="text-align: right;">₱${(payslip.deductions?.sssContribution || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>PhilHealth</td>
              <td style="text-align: right;">₱${(payslip.deductions?.philhealthContribution || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Pag-IBIG</td>
              <td style="text-align: right;">₱${(payslip.deductions?.pagibigContribution || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Withholding Tax</td>
              <td style="text-align: right;">₱${(payslip.deductions?.withholdinTax || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Other Deductions</td>
              <td style="text-align: right;">₱${(payslip.deductions?.otherDeductions || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL DEDUCTIONS</td>
              <td style="text-align: right;">₱${(payslip.deductions?.totalDeductions || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <table>
          <tbody>
            <tr class="net-pay-row">
              <td>NET PAY</td>
              <td style="text-align: right; font-size: 18px;">₱${(payslip.netPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>This is a system-generated payslip. For inquiries, please contact HR.</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Open in new window and print
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="payslip-viewer-container">
      <h2>My Payslips</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading && !selectedPayslip ? (
        <p>Loading payslips...</p>
      ) : payslips.length > 0 ? (
        <>
          {!selectedPayslip ? (
            <div className="payslips-list">
              <h3>Payslip History</h3>
              <div className="payslips-grid">
                {payslips.map((payslip) => (
                  <div key={payslip._id} className="payslip-card">
                    <h4>{payslip.periodInfo?.periodName}</h4>
                    <p className="period-dates">
                      {new Date(payslip.periodInfo?.startDate).toLocaleDateString()} - {new Date(payslip.periodInfo?.endDate).toLocaleDateString()}
                    </p>
                    <p className="net-pay">
                      Net Pay: <strong>₱{(payslip.netPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</strong>
                    </p>
                    <p className="status">Status: <span className={`status-badge ${payslip.status}`}>{payslip.status}</span></p>
                    <div className="card-actions">
                      <button
                        onClick={() => handleViewPayslip(payslip._id)}
                        className="btn btn-primary"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(payslip._id)}
                        disabled={loading}
                        className="btn btn-secondary"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="payslip-detail">
              <button onClick={() => setSelectedPayslip(null)} className="btn-back">← Back</button>

              <h3>{selectedPayslip.periodInfo?.periodName} Payslip</h3>

              <div className="payslip-header">
                <p><strong>Employee:</strong> {selectedPayslip.employeeDetails?.firstName} {selectedPayslip.employeeDetails?.lastName}</p>
                <p><strong>Position:</strong> {selectedPayslip.employeeDetails?.position}</p>
                <p><strong>Department:</strong> {selectedPayslip.employeeDetails?.department}</p>
              </div>

              <div className="payslip-sections">
                <div className="section">
                  <h4>EARNINGS</h4>
                  <div className="line-item">
                    <span>Basic Salary</span>
                    <span>₱{(selectedPayslip.earnings?.basicSalary || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                  </div>
                  {selectedPayslip.earnings?.overtimePay > 0 && (
                    <div className="line-item">
                      <span>Overtime Pay</span>
                      <span>₱{selectedPayslip.earnings.overtimePay.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {selectedPayslip.earnings?.nightDifferentialPay > 0 && (
                    <div className="line-item">
                      <span>Night Differential</span>
                      <span>₱{selectedPayslip.earnings.nightDifferentialPay.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {selectedPayslip.earnings?.holidayPay > 0 && (
                    <div className="line-item">
                      <span>Holiday Pay</span>
                      <span>₱{selectedPayslip.earnings.holidayPay.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {selectedPayslip.earnings?.paidLeavePay > 0 && (
                    <div className="line-item">
                      <span>Paid Leave</span>
                      <span>₱{selectedPayslip.earnings.paidLeavePay.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {selectedPayslip.earnings?.allowances > 0 && (
                    <div className="line-item">
                      <span>Allowances</span>
                      <span>₱{selectedPayslip.earnings.allowances.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="line-item total">
                    <span>GROSS PAY</span>
                    <span>₱{(selectedPayslip.earnings?.grossPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="section">
                  <h4>DEDUCTIONS</h4>
                  {selectedPayslip.deductions?.lateDeduction > 0 && (
                    <div className="line-item">
                      <span>Tardiness</span>
                      <span>-₱{selectedPayslip.deductions.lateDeduction.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {selectedPayslip.deductions?.undertimeDeduction > 0 && (
                    <div className="line-item">
                      <span>Undertime</span>
                      <span>-₱{selectedPayslip.deductions.undertimeDeduction.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {selectedPayslip.deductions?.absenceDeduction > 0 && (
                    <div className="line-item">
                      <span>Absences</span>
                      <span>-₱{selectedPayslip.deductions.absenceDeduction.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="line-item">
                    <span>SSS Contribution</span>
                    <span>-₱{(selectedPayslip.deductions?.sssContribution || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="line-item">
                    <span>PhilHealth</span>
                    <span>-₱{(selectedPayslip.deductions?.philhealthContribution || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="line-item">
                    <span>Pag-IBIG</span>
                    <span>-₱{(selectedPayslip.deductions?.pagibigContribution || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="line-item">
                    <span>Withholding Tax</span>
                    <span>-₱{(selectedPayslip.deductions?.withholdinTax || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="line-item total">
                    <span>TOTAL DEDUCTIONS</span>
                    <span>-₱{(selectedPayslip.deductions?.totalDeductions || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="section net-pay-section">
                  <div className="line-item net-pay-amount">
                    <strong>NET PAY</strong>
                    <strong className="amount">₱{(selectedPayslip.netPay || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              </div>

              <div className="payslip-actions">
                <button
                  onClick={() => handleDownloadPDF(selectedPayslip._id)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  Download as PDF
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-payslips">
          <p>No payslips available yet.</p>
          <p>Payslips will appear here once your payroll has been processed and approved.</p>
        </div>
      )}
    </div>
  );
}

export default PayslipViewer;
