import React, { useState, useEffect } from 'react';
import AttendanceWidget from '../AttendanceWidget';
import FileCorrectionForm from '../TimeCorrection/FileCorrectionForm';
import PendingCorrections from '../TimeCorrection/PendingCorrections';
import '../../styles/Dashboards.css';

function Attendance() {
  const [departmentAttendance, setDepartmentAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showPendingCorrections, setShowPendingCorrections] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      setUser(JSON.parse(userString));
    }
    fetchDepartmentAttendance(1);
  }, []);

  /**
   * Fetch paginated attendance for HR Head (company-wide)
   */
  const fetchDepartmentAttendance = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/attendance/paginated?page=${page}&limit=10&search=${searchTerm}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        console.error('Response not ok:', response.statusText);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Parsed data:', data);
      if (data.success) {
        setDepartmentAttendance(data.data.records);
        setTotalPages(data.data.pagination.totalPages);
        setCurrentPage(page);
      } else {
        console.error('API returned success: false', data);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDepartmentAttendance(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchDepartmentAttendance(newPage);
    }
  };

  /**
   * Format time for display
   */
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  /**
   * Get status badge styling based on status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return '#d4edda';
      case 'late':
        return '#fff3cd';
      case 'absent':
        return '#f8d7da';
      case 'checked-out':
        return '#d1ecf1';
      default:
        return '#f5f5f5';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'present':
        return '#155724';
      case 'late':
        return '#856404';
      case 'absent':
        return '#721c24';
      case 'checked-out':
        return '#0c5460';
      default:
        return '#333';
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div className="section-header">
        <h2>Attendance Management (HR Head)</h2>
        <p>View and manage company-wide attendance records</p>
      </div>

      {/* Daily Attendance Widget */}
      <AttendanceWidget />

      {/* Company Attendance Section */}
      {user && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Company Attendance Records</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => fetchDepartmentAttendance(currentPage)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => setShowPendingCorrections(!showPendingCorrections)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: showPendingCorrections ? '#28a745' : '#ffc107',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                📋 {showPendingCorrections ? 'Hide Pending' : 'View Pending'} Corrections
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading attendance records...</p>
          ) : (
            <>
              {showPendingCorrections && (
                <div style={{ marginBottom: '2rem' }}>
                  <PendingCorrections userRole={user?.role} />
                </div>
              )}
              {departmentAttendance.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Employee Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Department</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Check-In / Check-Out</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Total Hours</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentAttendance.map((record) => (
                    <tr key={record._id} style={{ borderBottom: '1px solid #eee', backgroundColor: record._id % 2 === 0 ? '#fafafa' : 'white' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong>
                          {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Unknown Employee'}
                        </strong>
                      </td>
                      <td style={{ padding: '1rem' }}>{record.department}</td>
                      <td style={{ padding: '1rem' }}>
                        <span>{formatTime(record.checkInTime)} - {formatTime(record.checkOutTime)}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {record.totalHours > 0 ? `${record.totalHours.toFixed(2)} hrs` : '-'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            backgroundColor: getStatusColor(record.status),
                            color: getStatusTextColor(record.status),
                          }}
                        >
                          {record.status === 'present' && '✓ Present'}
                          {record.status === 'late' && '⚠️ Late'}
                          {record.status === 'absent' && '✗ Absent'}
                          {record.status === 'checked-out' && '✔ Checked-Out'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                <p>No attendance records found.</p>
              </div>
            )}

            {/* Pagination Controls */}
            {departmentAttendance.length > 0 && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: currentPage === 1 ? '#ccc' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Previous
                </button>
                
                <div style={{ margin: '0 1rem', fontWeight: 'bold' }}>
                  Page {currentPage} of {totalPages}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: currentPage === totalPages ? '#ccc' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}

export default Attendance;
