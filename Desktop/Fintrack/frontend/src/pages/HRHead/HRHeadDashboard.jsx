import React from 'react';
import UnifiedDashboardLayout from '../../components/UnifiedDashboard/UnifiedDashboardLayout';

// Import sub-components
import HRHeadDashboardHome from '../../components/HRHead/DashboardHome';
import MyProfile from '../../components/Supervisor/MyProfile';
import LeaveManagement from '../../components/HRHead/LeaveManagement';
import Attendance from '../../components/HRHead/Attendance';
import Payroll from '../../components/Supervisor/Payroll';
import PayrollForm from '../../components/Payroll/PayrollForm';
import PayrollWorkflow from '../../components/HRHead/PayrollWorkflow';
import EmployeeManagement from '../../components/HRHead/EmployeeManagement';
import AnnouncementCreation from '../../components/Supervisor/AnnouncementCreation';
import Calendar from '../../components/Supervisor/Calendar';
import Reports from '../../components/HRHead/Reports';
import TaxSettings from '../../components/HRHead/TaxSettings';
import UnlockRequests from '../../components/HRHead/UnlockRequests';
import VoucherReplenishment from '../../components/HRHead/VoucherReplenishment';
import MarketingDashboard from '../../components/Marketing/MarketingDashboard';
import PerformanceEvaluation from '../../components/HRHead/PerformanceEvaluation';

function HRHeadDashboard() {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'performance', label: 'Performance Evaluation', icon: '📈' },
    { id: 'voucher-replenish', label: 'Voucher Replenishment', icon: '🔄' },
    { id: 'gas-pricing', label: 'Gas Pricing', icon: '⛽' },
    { id: 'leave', label: 'Leave Approvals', icon: '✅' },
    { id: 'attendance', label: 'Attendance', icon: '📍' },
    { id: 'payroll', label: 'Payroll', icon: '💰' },
    { id: 'payroll-form', label: 'Initialize & Compute', icon: '📝' },
    { id: 'payroll-workflow', label: 'Payroll Workflow', icon: '⚙️' },
    { id: 'tax-settings', label: 'Tax Settings', icon: '🧮' },
    { id: 'reports', label: 'Reports & Export', icon: '📊' },
    { id: 'employees', label: 'Employee Management', icon: '👥' },
    { id: 'unlock-requests', label: 'Account Unlocks', icon: '🔓' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
  ];

  const renderContent = (activeTab, user, setActiveTab) => {
    switch (activeTab) {
      case 'dashboard':
        return <HRHeadDashboardHome user={user} onNavigate={setActiveTab} />;
      case 'profile':
        return <MyProfile user={user} />;
      case 'performance':
        return <PerformanceEvaluation />;
      case 'voucher-replenish':
        return <VoucherReplenishment />;
      case 'gas-pricing':
        return <MarketingDashboard />;
      case 'leave':
        return <LeaveManagement />;
      case 'attendance':
        return <Attendance />;
      case 'payroll':
        return <Payroll />;
      case 'payroll-form':
        return <PayrollForm />;
      case 'payroll-workflow':
        return <PayrollWorkflow />;
      case 'tax-settings':
        return <TaxSettings />;
      case 'employees':
        return <EmployeeManagement />;
      case 'unlock-requests':
        return <UnlockRequests userRole={user?.role} />;
      case 'announcements':
        return <AnnouncementCreation />;
      case 'calendar':
        return <Calendar />;
      case 'reports':
        return <Reports />;
      default:
        return <HRHeadDashboardHome user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <UnifiedDashboardLayout
      role="hr_head"
      title="FinTrack - HR Head Dashboard"
      menuItems={menuItems}
      renderContent={renderContent}
      defaultTab="dashboard"
      storageKey="hrHeadActiveTab"
    />
  );
}

export default HRHeadDashboard;
