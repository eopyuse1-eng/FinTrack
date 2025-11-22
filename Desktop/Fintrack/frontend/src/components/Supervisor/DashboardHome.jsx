import React, { useState, useEffect } from 'react';

function DashboardHome({ user, onNavigate }) {
  const [loading, setLoading] = useState(false);


  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Welcome, {user?.firstName}!</h2>
        <p>Supervisor Dashboard</p>
      </div>

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total HR Heads</h3>
            <p className="stat-value">0</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon">👨‍💼</div>
          <div className="card-content">
            <h3>Total HR Staff</h3>
            <p className="stat-value">0</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon">💼</div>
          <div className="card-content">
            <h3>Total Employees</h3>
            <p className="stat-value">0</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon">📋</div>
          <div className="card-content">
            <h3>Pending Requests</h3>
            <p className="stat-value">0</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => onNavigate('employees')}>
            <span className="btn-icon">➕</span>
            Create HR Head
          </button>
          <button className="action-btn" onClick={() => onNavigate('attendance')}>
            <span className="btn-icon">📊</span>
            View Reports
          </button>
          <button className="action-btn" onClick={() => onNavigate('calendar')}>
            <span className="btn-icon">📅</span>
            Check Calendar
          </button>
          <button className="action-btn" onClick={() => onNavigate('announcements')}>
            <span className="btn-icon">📢</span>
            New Announcement
          </button>
        </div>
      </div>


    </div>
  );
}

export default DashboardHome;

