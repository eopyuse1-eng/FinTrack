import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      setUser(userData);

      // Redirect Seeder Admin to their dashboard
      if (userData.role === 'seeder_admin') {
        navigate('/seeder-admin');
        return;
      }

      // Redirect Supervisor to their dashboard
      if (userData.role === 'supervisor') {
        navigate('/supervisor');
        return;
      }

      // Redirect HR Head to their dashboard
      if (userData.role === 'hr_head') {
        navigate('/hr-head');
        return;
      }

      // Redirect HR Staff to their dashboard
      if (userData.role === 'hr_staff') {
        navigate('/hr-staff');
        return;
      }

      // Redirect Employee based on their department
      if (userData.role === 'employee') {
        console.log('Employee department:', userData.department);
        if (userData.department === 'treasury') {
          navigate('/treasury-employee');
          return;
        } else if (userData.department === 'marketing') {
          navigate('/marketing-employee');
          return;
        } else {
          // If no valid department, show error
          console.error('Employee has no valid department:', userData.department);
          // Redirect to login as fallback
          navigate('/');
          return;
        }
      }
    }
    checkApiStatus();
  }, [navigate]);

  const checkApiStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/');
      setApiStatus(response.data.message);
    } catch (error) {
      setApiStatus('API is not running');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>FinTrack</h1>
        <p>Dashboard</p>
      </header>

      <nav className="nav">
        <Link to="/home">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </nav>

      <main className="main-content">
        <section className="dashboard-hero">
          <h2>Dashboard</h2>
          <p>Welcome back! Here's your overview.</p>
        </section>

        <div className="dashboard-grid">
          <div className="card">
            <h3>API Status</h3>
            {loading ? (
              <p>Checking...</p>
            ) : (
              <p className="status-text">{apiStatus}</p>
            )}
            <button onClick={checkApiStatus} className="btn">Refresh</button>
          </div>

          <div className="card">
            <h3>Total Employees</h3>
            <p className="stat-number">0</p>
          </div>

          <div className="card">
            <h3>Active Departments</h3>
            <p className="stat-number">0</p>
          </div>

          <div className="card">
            <h3>Total Payroll</h3>
            <p className="stat-number">$0</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 FinTrack. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Dashboard;
