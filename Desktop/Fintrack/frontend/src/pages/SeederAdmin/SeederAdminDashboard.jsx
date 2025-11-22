import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AdminDashboard.css';

function SeederAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalSupervisors: 0,
    totalUsers: 0,
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      setUser(userData);
    }
    if (!token) {
      navigate('/');
    }
    fetchSupervisors();
  }, [token, navigate]);

  const fetchSupervisors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSupervisors(data.users || []);
        setStats(prev => ({
          ...prev,
          totalSupervisors: data.users ? data.users.length : 0,
          totalUsers: data.total || 0,
        }));
      }
    } catch (err) {
      console.error('Error fetching supervisors:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    setError('');

    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: 'supervisor',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Supervisor created successfully: ${data.user.email}`);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        setShowForm(false);
        fetchSupervisors();
        
        // Simulate logout after 2 seconds and redirect to login
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }, 2000);
      } else {
        setError(data.message || 'Error creating supervisor');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-content">
          <h1>🔐 FinTrack - Seeder Admin</h1>
          <p>System Initialization & Supervisor Management</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <nav className="nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/">Home</Link>
        <span className="user-info">👤 {user?.firstName} {user?.lastName}</span>
      </nav>

      <main className="main-content">
        {/* Hero Section */}
        <section className="dashboard-hero">
          <h2>🔐 Seeder Admin Dashboard</h2>
          <p>Initialize system by creating supervisors. Note: This account will be automatically disabled after creating the first supervisor.</p>
        </section>

        {/* Alerts */}
        {error && <div className="alert alert-error">❌ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        {/* Main Content Grid */}
        <div className="admin-content-grid">
          {/* Seeder Admin Info Section */}
          <section className="admin-section">
            <div className="section-header">
              <h2>ℹ️ Seeder Admin Information</h2>
              <p>Important details about your role</p>
            </div>
            <div className="info-grid">
              <div className="info-box">
                <h4>🔐 Your Role</h4>
                <ul>
                  <li>Only ONE Seeder Admin allowed per system</li>
                  <li>Create supervisors to manage HR operations</li>
                  <li>Will be automatically disabled after first supervisor</li>
                  <li>All actions are logged</li>
                </ul>
              </div>
              <div className="info-box">
                <h4>👥 Role Hierarchy</h4>
                <ul>
                  <li>Seeder Admin (You) → Creates Supervisors</li>
                  <li>Supervisor → Creates HR Heads</li>
                  <li>HR Head → Creates HR Staff & Employees</li>
                  <li>Complete 4-level role hierarchy</li>
                </ul>
              </div>
              <div className="info-box">
                <h4>📝 Next Steps</h4>
                <ul>
                  <li>1. Create at least one Supervisor below</li>
                  <li>2. Your account will be disabled</li>
                  <li>3. Supervisor takes over management</li>
                  <li>4. Supervisor creates HR Heads</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Supervisor Creation Section */}
          <section className="admin-section">
            <form onSubmit={handleSubmit} className="registration-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password (min 6 characters)"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? 'Creating...' : '✓ Add New Supervisor'}
                  </button>
                </div>
              </form>
            </section>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 FinTrack. All rights reserved. | Seeder Admin Dashboard</p>
      </footer>
    </div>
  );
}

export default SeederAdminDashboard;
