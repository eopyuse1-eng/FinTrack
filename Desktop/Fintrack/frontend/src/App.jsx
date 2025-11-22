import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/UnifiedDesignSystem.css';
import './styles/Dashboards.css';
import './styles/Navigation.css';
import './styles/App.css';
import './styles/SupervisorComponents.css';
import './styles/Notifications.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SeederAdminDashboard from './pages/SeederAdmin/SeederAdminDashboard';
import SupervisorDashboard from './pages/Supervisor/SupervisorDashboard';
import HRHeadDashboard from './pages/HRHead/HRHeadDashboard';
import HRStaffDashboard from './pages/HRStaff/HRStaffDashboard';
import TreasuryEmployeeDashboard from './pages/Employee/TreasuryEmployeeDashboard';
import MarketingEmployeeDashboard from './pages/Employee/MarketingEmployeeDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  useEffect(() => {
    // Check token on app load
    const token = localStorage.getItem('token');
    if (!token) {
      // Token expired or missing, redirect to login
      localStorage.removeItem('user');
    }
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes - Seeder Admin */}
          <Route
            path="/seeder-admin"
            element={
              <ProtectedRoute allowedRoles={['seeder_admin']}>
                <SeederAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Supervisor */}
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - HR Head */}
          <Route
            path="/hr-head"
            element={
              <ProtectedRoute allowedRoles={['hr_head']}>
                <HRHeadDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - HR Staff */}
          <Route
            path="/hr-staff"
            element={
              <ProtectedRoute allowedRoles={['hr_staff']}>
                <HRStaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Treasury Employee */}
          <Route
            path="/treasury-employee"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <TreasuryEmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Marketing Employee */}
          <Route
            path="/marketing-employee"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <MarketingEmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
