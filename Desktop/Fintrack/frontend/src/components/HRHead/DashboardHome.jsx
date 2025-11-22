import React, { useState, useEffect } from 'react';

function DashboardHome({ user, onNavigate }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    pendingUnlocks: 0,
  });
  const [activity, setActivity] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity(activityPage);
  }, [activityPage]);

  const fetchRecentActivity = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/audit-logs/paginated?page=${page}&limit=5`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setActivity(data.data.activities);
        setActivityTotalPages(data.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/attendance/dashboard/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Dashboard Stats Response:', data);
      if (data.success) {
        setStats({
          totalEmployees: data.data.totalEmployees || 0,
          presentToday: data.data.presentToday || 0,
          absentToday: data.data.absentToday || 0,
          pendingLeaves: data.data.pendingLeaves || 0,
          pendingUnlocks: data.data.pendingUnlocks || 0,
        });
        setError('');
      } else {
        setError(data.message || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'leave_approved': return '✅';
      case 'leave_rejected': return '❌';
      case 'leave_request': return '📋';
      case 'payroll': return '💰';
      case 'security': return '🔒';
      case 'registration': return '📝';
      case 'attendance': return '✓';
      case 'unlock_request': return '🔓';
      case 'unlock_approved': return '✓';
      case 'unlock_denied': return '✕';
      default: return '📝';
    }
  };

  const formatActivityTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="dashboard-home-section">
      <div className="section-header">
        <h2>Dashboard</h2>
        <p>HR Head Overview</p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          backgroundColor: 'var(--color-error-bg)', 
          color: 'var(--color-error-text)', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{loading ? '-' : stats.totalEmployees}</h3>
            <p>Employees</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{loading ? '-' : stats.presentToday}</h3>
            <p>Present Today</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{loading ? '-' : stats.pendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔓</div>
          <div className="stat-content">
            <h3>{loading ? '-' : stats.pendingUnlocks}</h3>
            <p>Unlock Requests</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{loading ? '-' : stats.absentToday}</h3>
            <p>Absent Today</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
        <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: '4px', padding: '1rem' }}>
          {activity.length > 0 ? (
            <>
              {activity.map((item, index) => (
                <div key={index} style={{ 
                  paddingBottom: index < activity.length - 1 ? '0.75rem' : 0, 
                  marginBottom: index < activity.length - 1 ? '0.75rem' : 0,
                  borderBottom: index < activity.length - 1 ? '1px solid #eee' : 'none'
                }}>
                  <p style={{ margin: '0.25rem 0', fontWeight: 'bold' }}>
                    {getActivityIcon(item.type)} {item.message}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{formatActivityTime(item.time)}</p>
                </div>
              ))}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                <button 
                  onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                  disabled={activityPage === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: activityPage === 1 ? '#ccc' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: activityPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Page {activityPage} of {activityTotalPages}
                </span>
                <button 
                  onClick={() => setActivityPage(Math.min(activityTotalPages, activityPage + 1))}
                  disabled={activityPage === activityTotalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: activityPage === activityTotalPages ? '#ccc' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: activityPage === activityTotalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', margin: '1rem 0' }}>No activity yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <button 
            onClick={() => onNavigate('employees')}
            style={{ padding: '1rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            👥 Employees
          </button>
          <button 
            onClick={() => onNavigate('leave')}
            style={{ padding: '1rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            📋 Leaves
          </button>
          <button 
            onClick={() => onNavigate('attendance')}
            style={{ padding: '1rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            ✓ Attendance
          </button>
          <button 
            onClick={() => onNavigate('unlock-requests')}
            style={{ padding: '1rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            🔓 Unlocks
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;

