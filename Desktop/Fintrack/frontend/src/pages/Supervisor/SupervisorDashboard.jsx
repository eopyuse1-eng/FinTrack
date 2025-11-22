import React from 'react';
import UnifiedDashboardLayout from '../../components/UnifiedDashboard/UnifiedDashboardLayout';

// Import sub-components
import SupervisorDashboardHome from '../../components/Supervisor/DashboardHome';
import MyProfile from '../../components/Supervisor/MyProfile';
import LeaveManagement from '../../components/Supervisor/LeaveManagement';
import Attendance from '../../components/Supervisor/Attendance';
import Payroll from '../../components/Supervisor/Payroll';
import EmployeeManagement from '../../components/Supervisor/EmployeeManagement';
import AnnouncementCreation from '../../components/Supervisor/AnnouncementCreation';
import Calendar from '../../components/Supervisor/Calendar';
import CorrectionHistory from '../../components/TimeCorrection/CorrectionHistory';
import PerformanceEvaluation from '../../components/HRHead/PerformanceEvaluation';

function SupervisorDashboard() {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'performance', label: 'Performance Evaluation', icon: '📈' },
    { id: 'leave', label: 'Leave Approvals', icon: '✅' },
    { id: 'payroll', label: 'Payroll', icon: '💰' },
    { id: 'employees', label: 'Employee Management', icon: '👥' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'correction-history', label: 'File Correction History', icon: '📋' },
  ];

  const renderContent = (activeTab, user, setActiveTab) => {
    switch (activeTab) {
      case 'dashboard':
        return <SupervisorDashboardHome user={user} onNavigate={setActiveTab} />;
      case 'profile':
        return <MyProfile user={user} />;
      case 'performance':
        return <PerformanceEvaluation />;
      case 'leave':
        return <LeaveManagement />;
      case 'payroll':
        return <Payroll />;
      case 'employees':
        return <EmployeeManagement />;
      case 'announcements':
        return <AnnouncementCreation />;
      case 'calendar':
        return <Calendar />;
      case 'correction-history':
        return <CorrectionHistory userRole={user?.role} />;
      default:
        return <SupervisorDashboardHome user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <UnifiedDashboardLayout
      role="supervisor"
      title="FinTrack - Supervisor Dashboard"
      menuItems={menuItems}
      renderContent={renderContent}
      defaultTab="dashboard"
      storageKey="supervisorActiveTab"
    />
  );
}

export default SupervisorDashboard;
