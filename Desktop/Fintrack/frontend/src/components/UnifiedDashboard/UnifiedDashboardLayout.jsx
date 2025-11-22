import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Notifications from '../Notifications';
import VoucherNotifications from '../VoucherNotifications';

/**
 * UnifiedDashboardLayout - Single layout component for all dashboard roles
 * Provides consistent UI structure (header, sidebar, content area) for all roles
 * Role-specific content and menu items are passed as props
 */
function UnifiedDashboardLayout({
  role,
  title,
  menuItems,
  renderContent,
  defaultTab = 'dashboard',
  storageKey = 'dashboardActiveTab',
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(storageKey) || defaultTab;
  });
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
  }, [token, navigate]);

  useEffect(() => {
    localStorage.setItem(storageKey, activeTab);
  }, [activeTab, storageKey]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
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

  const handleNavClick = (itemId) => {
    setActiveTab(itemId);
    // Only close sidebar on mobile/tablet (screen width <= 768px)
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="supervisor-dashboard-container">
      {/* Header */}
      <header className="supervisor-header">
        <div className="header-left">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1>{title}</h1>
        </div>
        <div className="header-right">
          <VoucherNotifications />
          <Notifications />
          <span className="user-info">{user?.firstName} {user?.lastName}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="supervisor-content">
        {/* Sidebar Navigation */}
        <nav className={`supervisor-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="nav-header">
            <h2>Menu</h2>
          </div>

          <ul className="nav-menu">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span className="icon">{item.icon}</span>
                  <span className="label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="supervisor-main">
          {renderContent(activeTab, user, setActiveTab)}
        </main>
      </div>
    </div>
  );
}

export default UnifiedDashboardLayout;
