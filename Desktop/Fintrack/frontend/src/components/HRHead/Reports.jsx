import React, { useState, useEffect } from 'react';
import '../../styles/Dashboards.css';

function Reports() {
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch report data on component mount and when filters change
  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Map report types to backend endpoints
      const endpoint = `http://localhost:5000/api/reports/${reportType}/data?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReportData(data.data);
          console.log(`Report data fetched for ${reportType}:`, data.data);
        }
      } else {
        console.error('Error fetching report:', response.status);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!reportData) {
      alert('No report data available');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/reports/${reportType}/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      });

      if (response.ok) {
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition ? contentDisposition.split('filename=')[1].replace(/"/g, '') : `${reportType}_report.xlsx`;
        
        const blob = await response.blob();
        const element = document.createElement('a');
        element.setAttribute('href', URL.createObjectURL(blob));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);
      } else {
        alert('Error exporting to Excel');
      }
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Error exporting to Excel');
    }
  };

  const handleExportPDF = async () => {
    if (!reportData) {
      alert('No report data available');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/reports/${reportType}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      });

      if (response.ok) {
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition ? contentDisposition.split('filename=')[1].replace(/"/g, '') : `${reportType}_report.pdf`;
        
        const blob = await response.blob();
        const element = document.createElement('a');
        element.setAttribute('href', URL.createObjectURL(blob));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);
      } else {
        alert('Error exporting to PDF');
      }
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      alert('Error exporting to PDF');
    }
  };

  const getReportStats = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'attendance':
        return {
          totalEmployees: reportData.totalEmployees || 0,
          presentDays: reportData.presentDays || 0,
          absentDays: reportData.absentDays || 0,
          lateDays: reportData.lateDays || 0,
          averageAttendance: reportData.averageAttendance || 0,
        };
      case 'leave':
        return {
          totalRequests: reportData.totalRequests || 0,
          approved: reportData.approved || 0,
          rejected: reportData.rejected || 0,
          pending: reportData.pending || 0,
          daysUtilized: reportData.daysUtilized || 0,
        };
      case 'payroll':
        return {
          totalEmployees: reportData.totalEmployees || 0,
          totalPayroll: reportData.totalPayroll || 0,
          averageSalary: reportData.averageSalary || 0,
          totalDeductions: reportData.totalDeductions || 0,
        };
      case 'performance':
        return {
          totalEvaluations: reportData.totalEvaluations || 0,
          highPerformers: reportData.highPerformers || 0,
          averagePerformers: reportData.averagePerformers || 0,
          lowPerformers: reportData.lowPerformers || 0,
        };
      default:
        return null;
    }
  };

  const stats = getReportStats();

  return (
    <div style={{ padding: '2rem' }}>
      <div className="section-header">
        <h2>Reports (HR Head)</h2>
        <p>Generate and export company-wide reports</p>
      </div>

      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #ddd',
      }}>
        <h3>Report Filters</h3>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '1rem',
              }}
            >
              <option value="attendance">Attendance Report</option>
              <option value="leave">Leave Report</option>
              <option value="payroll">Payroll Report</option>
              <option value="performance">Performance Evaluation</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '1rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportExcel}
            disabled={!reportData || loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: reportData && !loading ? '#17a2b8' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: reportData && !loading ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            📊 Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!reportData || loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: reportData && !loading ? '#dc3545' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: reportData && !loading ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>⏳ Loading report data...</p>
        </div>
      )}

      {!reportData && !loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          <p>Select date range and report type to export data</p>
        </div>
      )}
    </div>
  );
}

export default Reports;
