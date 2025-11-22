import React, { useState, useEffect } from 'react';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchNotifications();
    fetchLowStockVouchers();
    fetchAnnouncements();
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    // Refresh low-stock alerts every 2 minutes
    const voucherInterval = setInterval(fetchLowStockVouchers, 2 * 60 * 1000);
    // Refresh announcements every 3 minutes
    const announcementInterval = setInterval(fetchAnnouncements, 3 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(voucherInterval);
      clearInterval(announcementInterval);
    };
  }, [token]);

  // Recalculate unread count whenever notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/all-employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const employees = data.employees || [];
        const today = new Date();
        const birthdayNotifications = [];
        const readBirthdayIds = new Set(JSON.parse(localStorage.getItem('readBirthdayNotifications') || '[]'));

        employees.forEach(person => {
          if (person.birthdate) {
            const birthDate = new Date(person.birthdate);
            const todayBirthday = new Date(
              today.getFullYear(),
              birthDate.getMonth(),
              birthDate.getDate()
            );

            // Check if birthday is today or within the next 7 days
            const daysUntilBirthday = Math.floor(
              (todayBirthday - today) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
              let message = '';
              if (daysUntilBirthday === 0) {
                message = `🎉 ${person.firstName} ${person.lastName}'s birthday is TODAY!`;
              } else if (daysUntilBirthday === 1) {
                message = `🎂 ${person.firstName} ${person.lastName}'s birthday is TOMORROW!`;
              } else {
                message = `📅 ${person.firstName} ${person.lastName}'s birthday is in ${daysUntilBirthday} days`;
              }

              const notificationId = `birthday-${person._id}`;
              birthdayNotifications.push({
                id: notificationId,
                message: message,
                type: 'birthday',
                daysUntilBirthday: daysUntilBirthday,
                timestamp: today.getTime(),
                read: readBirthdayIds.has(notificationId),
              });
            }
          }
        });

        // Sort by days until birthday (today first)
        birthdayNotifications.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

        setNotifications(prev => {
          // Keep existing voucher and announcement notifications, update birthday ones
          const voucherNotifs = prev.filter(n => n.type === 'voucher');
          const announcementNotifs = prev.filter(n => n.type === 'announcement');
          return [...birthdayNotifications, ...voucherNotifs, ...announcementNotifs];
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchLowStockVouchers = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Only fetch if user is treasury or hr_head
      if (user.role !== 'employee' && user.role !== 'hr_head') return;
      if (user.role === 'employee' && user.department !== 'treasury') return;

      const response = await fetch('http://localhost:5000/api/vouchers/low-stock', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const lowStockVouchers = data.data || [];
        const readVoucherIds = new Set(JSON.parse(localStorage.getItem('readVoucherNotifications') || '[]'));
        
        const voucherNotifications = lowStockVouchers.map(voucher => {
          const stockPercentage = Math.round(
            (voucher.availableStock / voucher.totalStock) * 100
          );
          let urgency = 'low';
          let emoji = '⚠️';

          if (stockPercentage <= 25) {
            urgency = 'critical';
            emoji = '🔴';
          } else if (stockPercentage <= 50) {
            urgency = 'moderate';
            emoji = '🟠';
          }

          const notificationId = `voucher-${voucher._id}`;
          return {
            id: notificationId,
            message: `${emoji} Low Stock: ${voucher.voucherCode} (${voucher.availableStock}/${voucher.totalStock})`,
            type: 'voucher',
            urgency: urgency,
            voucherId: voucher._id,
            voucherCode: voucher.voucherCode,
            stockPercentage: stockPercentage,
            timestamp: new Date().getTime(),
            read: readVoucherIds.has(notificationId),
          };
        });

        setNotifications(prev => {
          // Keep birthday and announcement notifications, replace voucher ones
          const birthdayNotifs = prev.filter(n => n.type === 'birthday');
          const announcementNotifs = prev.filter(n => n.type === 'announcement');
          return [...birthdayNotifs, ...announcementNotifs, ...voucherNotifications];
        });
      }
    } catch (error) {
      console.error('Error fetching low-stock vouchers:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const announcements = data.data || [];

        const announcementNotifications = announcements.map(announcement => {
          let emoji = '📢';
          let bgColor = '#fff3e0';
          let borderColor = '#f57c00';

          if (announcement.priority === 'urgent') {
            emoji = '🚨';
            bgColor = '#ffebee';
            borderColor = '#d32f2f';
          } else if (announcement.priority === 'high') {
            emoji = '⚠️';
            bgColor = '#fff3e0';
            borderColor = '#f57c00';
          }

          return {
            id: `announcement-${announcement._id}`,
            message: `${emoji} ${announcement.title}`,
            content: announcement.content,
            type: 'announcement',
            priority: announcement.priority,
            read: announcement.isRead,
            timestamp: new Date(announcement.createdAt).getTime(),
            bgColor,
            borderColor,
          };
        });

        setNotifications(prev => {
          // Keep birthday and voucher notifications, replace announcement ones
          const birthdayNotifs = prev.filter(n => n.type === 'birthday');
          const voucherNotifs = prev.filter(n => n.type === 'voucher');
          return [...birthdayNotifs, ...voucherNotifs, ...announcementNotifications];
        });
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Persist announcement read status to backend
    if (notificationId.startsWith('announcement-')) {
      const announcementId = notificationId.replace('announcement-', '');
      markAnnouncementAsRead(announcementId);
    }
    
    // Persist birthday notification read status to localStorage
    if (notificationId.startsWith('birthday-')) {
      const readBirthdayIds = new Set(JSON.parse(localStorage.getItem('readBirthdayNotifications') || '[]'));
      readBirthdayIds.add(notificationId);
      localStorage.setItem('readBirthdayNotifications', JSON.stringify(Array.from(readBirthdayIds)));
    }
    
    // Persist voucher notification read status to localStorage
    if (notificationId.startsWith('voucher-')) {
      const readVoucherIds = new Set(JSON.parse(localStorage.getItem('readVoucherNotifications') || '[]'));
      readVoucherIds.add(notificationId);
      localStorage.setItem('readVoucherNotifications', JSON.stringify(Array.from(readVoucherIds)));
    }
  };

  const markAnnouncementAsRead = async (announcementId) => {
    try {
      await fetch(`http://localhost:5000/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read locally
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);

      // Persist birthday notifications as read in localStorage
      const readBirthdayIds = new Set();
      const readVoucherIds = new Set();
      notifications.forEach(notif => {
        if (notif.type === 'birthday') {
          readBirthdayIds.add(notif.id);
        }
        if (notif.type === 'voucher') {
          readVoucherIds.add(notif.id);
        }
      });
      localStorage.setItem('readBirthdayNotifications', JSON.stringify(Array.from(readBirthdayIds)));
      localStorage.setItem('readVoucherNotifications', JSON.stringify(Array.from(readVoucherIds)));

      // Mark announcements as read on backend
      await fetch('http://localhost:5000/api/announcements/read/all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="notifications-container">
      <button
        className="notification-bell"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {notifications.length > 0 && (
                <>
                  <button
                    className="clear-btn"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Mark all read
                  </button>
                  <button
                    className="clear-btn"
                    onClick={clearAll}
                    title="Clear all"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'} ${
                    notification.type === 'voucher' ? `voucher-alert-${notification.urgency}` : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                  style={notification.type === 'voucher' ? {
                    backgroundColor: notification.urgency === 'critical' ? '#ffebee' : '#fff3e0',
                    borderLeft: `4px solid ${
                      notification.urgency === 'critical' ? '#d32f2f' : '#f57c00'
                    }`,
                    cursor: 'pointer',
                  } : notification.type === 'announcement' ? {
                    backgroundColor: notification.bgColor,
                    borderLeft: `4px solid ${notification.borderColor}`,
                    cursor: 'pointer',
                  } : { cursor: 'pointer' }}
                >
                  <p className="notification-message">{notification.message}</p>
                  {notification.type === 'voucher' && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#666',
                      margin: '0.25rem 0 0 0',
                      padding: '0.25rem 0',
                    }}>
                      Stock at {notification.stockPercentage}% - Replenishment recommended
                    </p>
                  )}
                  {notification.type === 'announcement' && (
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#666',
                      margin: '0.25rem 0 0 0',
                      padding: '0.25rem 0',
                    }}>
                      {notification.content.substring(0, 80)}...
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
