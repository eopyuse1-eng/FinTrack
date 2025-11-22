import React from 'react';
import UnifiedDashboardLayout from '../../components/UnifiedDashboard/UnifiedDashboardLayout';
import DashboardHome from '../../components/HRStaff/DashboardHome';
import MyProfile from '../../components/Supervisor/MyProfile';
import Attendance from '../../components/HRStaff/Attendance';
import EmployeeManagement from '../../components/HRStaff/EmployeeManagement';
import AnnouncementCreation from '../../components/Supervisor/AnnouncementCreation';
import Calendar from '../../components/Supervisor/Calendar';
import Leave from '../../components/HRStaff/Leave';
import CorrectionHistory from '../../components/TimeCorrection/CorrectionHistory';
import Payroll from '../../components/Payroll/PayrollForm';
import PerformanceEvaluation from '../../components/HRHead/PerformanceEvaluation';

function HRStaffDashboard() {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'performance', label: 'Performance Evaluation', icon: '📈' },
    { id: 'leave', label: 'Leaves', icon: '📋' },
    { id: 'attendance', label: 'Attendance', icon: '✓' },
    { id: 'employees', label: 'Manage Employees', icon: '👥' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'payroll', label: 'Payroll', icon: '💰' },
    { id: 'correction-history', label: 'File Correction History', icon: '📋' },
  ];

  const renderContent = (activeTab, user, setActiveTab) => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome onNavigate={setActiveTab} />;
      case 'profile':
        return <MyProfile user={user} />;
      case 'performance':
        return <PerformanceEvaluation />;
      case 'leave':
        return <Leave />;
      case 'attendance':
        return <Attendance />;
      case 'employees':
        return <EmployeeManagement />;
      case 'announcements':
        return <AnnouncementCreation />;
      case 'calendar':
        return <Calendar />;
      case 'payroll':
        return <Payroll />;
      case 'correction-history':
        return <CorrectionHistory userRole={user?.role} />;
      default:
        return <DashboardHome onNavigate={setActiveTab} />;
    }
  };

  return (
    <UnifiedDashboardLayout
      role="hr_staff"
      title="FinTrack - HR Staff Dashboard"
      menuItems={menuItems}
      renderContent={renderContent}
      defaultTab="dashboard"
      storageKey="hrStaffActiveTab"
    />
  );
}

export default HRStaffDashboard;
