import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeePayroll from './EmployeePayroll';
import '../Employee/styles/EmployeeDepartmentDashboard.css';

function TreasuryDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Only treasury employees can access this
      if (userData.role !== 'employee' || userData.department !== 'treasury') {
        navigate('/');
        return;
      }
      setUser(userData);
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [token, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'payroll':
        return <EmployeePayroll />;
      case 'home':
      default:
        return (
          <>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div>
                <div className="quick-stats-section">
                  <h3>Quick Stats</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h4>Attendance</h4>
                      <p className="stat-value">--</p>
                      <span className="stat-label">Present this month</span>
                    </div>
                    <div className="stat-card">
                      <h4>Leaves</h4>
                      <p className="stat-value">--</p>
                      <span className="stat-label">Remaining</span>
                    </div>
                    <div className="stat-card">
                      <h4>Documents</h4>
                      <p className="stat-value">--</p>
                      <span className="stat-label">On file</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="employee-department-dashboard">
      <div className="section-header">
        <h2>💳 Treasury Department</h2>
        <p>Your Treasury Department Profile</p>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          📊 Home
        </button>
        <button
          className={`tab-btn ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          💰 Payroll
        </button>
      </div>

      {renderContent()}
    </div>
  );
}

export default TreasuryDashboard;
