import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedDashboardLayout from '../../components/UnifiedDashboard/UnifiedDashboardLayout';
import MarketingDashboard from '../../components/Employee/MarketingDashboard';
import MyProfile from '../../components/Supervisor/MyProfile';
import Attendance from '../../components/HRHead/Attendance';
import Calendar from '../../components/Supervisor/Calendar';
import CorrectionHistory from '../../components/TimeCorrection/CorrectionHistory';
import EmployeeLeave from '../../components/Leave/EmployeeLeave';
import PayrollHistory from '../../components/Payroll/PayrollHistory';

function MarketingEmployeeDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Verify user is a marketing employee
  React.useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'employee' || userData.department !== 'marketing') {
        navigate('/');
        return;
      }
    }
  }, [token, navigate]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📈' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'attendance', label: 'Attendance', icon: '📍' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'correction-history', label: 'Correction History', icon: '📋' },
    { id: 'leave', label: 'Leave', icon: '✅' },
    { id: 'payroll-history', label: 'Payroll History', icon: '💰' },
  ];

  const renderContent = (activeTab, user) => {
    switch (activeTab) {
      case 'dashboard':
        return <MarketingDashboard />;
      case 'profile':
        return <MyProfile user={user} />;
      case 'attendance':
        return <Attendance />;
      case 'calendar':
        return <Calendar />;
      case 'correction-history':
        return <CorrectionHistory userRole={user?.role} />;
      case 'leave':
        return <EmployeeLeave />;
      case 'payroll-history':
        return <PayrollHistory />;
      default:
        return <MarketingDashboard />;
    }
  };

  return (
    <UnifiedDashboardLayout
      role="employee_marketing"
      title="FinTrack - Marketing Department"
      menuItems={menuItems}
      renderContent={renderContent}
      defaultTab="dashboard"
      storageKey="marketingEmployeeActiveTab"
    />
  );
}

export default MarketingEmployeeDashboard;
