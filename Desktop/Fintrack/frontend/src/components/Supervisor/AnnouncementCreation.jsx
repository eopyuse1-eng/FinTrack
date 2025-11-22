import React, { useState, useEffect } from 'react';

function AnnouncementCreation() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const expiresAtDate = formData.expiresAt ? new Date(formData.expiresAt).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const response = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          expiresAt: expiresAtDate,
          targetRoles: ['employee', 'supervisor', 'hr_head', 'treasury'],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Announcement published successfully!');
        setFormData({
          title: '',
          content: '',
          priority: 'normal',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        setShowForm(false);
        fetchAnnouncements();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to create announcement');
      }
    } catch (err) {
      setError('Error creating announcement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Delete this announcement?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Announcement deleted successfully!');
        fetchAnnouncements();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error deleting announcement');
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#4caf50',
      normal: '#2196f3',
      high: '#ff9800',
      urgent: '#d32f2f',
    };
    return colors[priority] || '#2196f3';
  };

  const getPriorityEmoji = (priority) => {
    const emojis = {
      low: '📌',
      normal: '📢',
      high: '⚠️',
      urgent: '🚨',
    };
    return emojis[priority] || '📢';
  };

  return (
    <div className="announcement-section">
      <div className="section-header">
        <h2>Announcements & Notifications</h2>
        <p>Create and manage company announcements - All staff will be notified</p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          ✅ {success}
        </div>
      )}

      {!showForm ? (
        <button
          className="primary-btn"
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            marginBottom: '1.5rem',
          }}
        >
          + Create Announcement
        </button>
      ) : (
        <div className="form-container" style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <form onSubmit={handleSubmit} className="announcement-form">
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Announcement Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter announcement title"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="content" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Content
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Enter announcement content"
                rows="6"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="priority" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Priority Level
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="low">📌 Low</option>
                  <option value="normal">📢 Normal</option>
                  <option value="high">⚠️ High</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="expiresAt" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Expiration Date
                </label>
                <input
                  type="date"
                  id="expiresAt"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                className="primary-btn"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Publishing...' : '✓ Publish Announcement'}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="announcements-list">
        <h3 style={{ marginBottom: '1.5rem' }}>Recent Announcements</h3>
        {announcements.length > 0 ? (
          <div className="announcements" style={{
            display: 'grid',
            gap: '1rem',
          }}>
            {announcements.map(announcement => (
              <div
                key={announcement._id}
                className={`announcement-item priority-${announcement.priority}`}
                style={{
                  backgroundColor: 'white',
                  border: `2px solid ${getPriorityColor(announcement.priority)}`,
                  borderRadius: '8px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <div className="announcement-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '1rem',
                }}>
                  <h4 style={{ margin: 0, color: '#333' }}>
                    {getPriorityEmoji(announcement.priority)} {announcement.title}
                  </h4>
                  <span className={`priority-badge ${announcement.priority}`} style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: getPriorityColor(announcement.priority),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}>
                    {announcement.priority.toUpperCase()}
                  </span>
                </div>
                <p className="announcement-content" style={{
                  margin: '0 0 1rem 0',
                  lineHeight: '1.6',
                  color: '#555',
                }}>
                  {announcement.content}
                </p>
                <div className="announcement-footer" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #eee',
                  fontSize: '0.85rem',
                  color: '#999',
                }}>
                  <span className="date">
                    📅 {new Date(announcement.createdAt).toLocaleDateString()} at{' '}
                    {new Date(announcement.createdAt).toLocaleTimeString()}
                  </span>
                  <span style={{ color: '#999' }}>
                    👤 {announcement.createdBy?.firstName} {announcement.createdBy?.lastName}
                  </span>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                    style={{
                      backgroundColor: '#ffebee',
                      color: '#d32f2f',
                      border: '1px solid #d32f2f',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            color: '#999',
          }}>
            <p>No announcements yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnnouncementCreation;
