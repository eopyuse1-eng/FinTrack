import React, { useState, useEffect } from 'react';

function MyProfile({ user }) {
  const [profile, setProfile] = useState(user || {});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [profilePicture, setProfilePicture] = useState(() => {
    // Use user email as key to store per-user profile pictures
    const userEmail = user?.email || localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'default';
    return localStorage.getItem(`profilePicture_${userEmail}`) || null;
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setProfile(user || {});
    setFormData(user || {});
    
    // Load user-specific profile picture when user changes
    if (user?.email) {
      const userProfilePicture = localStorage.getItem(`profilePicture_${user.email}`);
      setProfilePicture(userProfilePicture || null);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }

      // Convert to base64 and save to localStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const userEmail = profile.email || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'default');
        setProfilePicture(reader.result);
        localStorage.setItem(`profilePicture_${userEmail}`, reader.result);
        setSuccess('Profile picture updated!');
        setTimeout(() => setSuccess(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(formData);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(formData));
      } else {
        setError(data.message || 'Error updating profile');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validate
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.message || 'Error changing password');
      }
    } catch (err) {
      setPasswordError('Error connecting to server');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2>My Profile</h2>
        <button
          className={isEditing ? 'secondary-btn' : 'primary-btn'}
          onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="profile-card">
        <div className="profile-avatar">
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" className="profile-image" />
          ) : (
            <div className="avatar-placeholder">
              {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
            </div>
          )}
          {isEditing && (
            <div className="profile-picture-upload">
              <label htmlFor="profilePictureInput" className="upload-label">
                📷 Change Photo
              </label>
              <input
                id="profilePictureInput"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        <div className="profile-form">
          {/* Personal Information */}
          <h3 className="form-section-title">Personal Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="+63XXXXXXXXXX"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Birthdate</label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate ? formData.birthdate.split('T')[0] : ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Birthplace</label>
              <input
                type="text"
                name="birthplace"
                value={formData.birthplace || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Marital Status</label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              <option value="">Select Marital Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          {/* Address Information */}
          <h3 className="form-section-title">Address Information</h3>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Municipality</label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Province</label>
              <input
                type="text"
                name="province"
                value={formData.province || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Employment Information */}
          <h3 className="form-section-title">Employment Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                value={formData.role || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                value={formData.department || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={formData.position || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Employment Status</label>
              <input
                type="text"
                value={formData.employmentStatus || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Date Hired</label>
              <input
                type="date"
                name="dateHired"
                value={formData.dateHired ? formData.dateHired.split('T')[0] : ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Government IDs */}
          <h3 className="form-section-title">Government IDs</h3>

          <div className="form-row">
            <div className="form-group">
              <label>SSS Number</label>
              <input
                type="text"
                name="sssNo"
                value={formData.sssNo || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="10 digits"
              />
            </div>
            <div className="form-group">
              <label>TIN</label>
              <input
                type="text"
                name="tin"
                value={formData.tin || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="12 digits"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>PhilHealth Number</label>
              <input
                type="text"
                name="philHealthNo"
                value={formData.philHealthNo || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="12 digits"
              />
            </div>
            <div className="form-group">
              <label>HDMF ID</label>
              <input
                type="text"
                name="hdmfId"
                value={formData.hdmfId || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="12 digits"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <h3 className="form-section-title">Emergency Contact</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Emergency Contact Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="form-actions">
              <button
                className="primary-btn"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="secondary-btn"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Section */}
      <div className="profile-card">
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h3 className="form-section-title" style={{ margin: 0, flex: 0 }}>Security</h3>
            <button
              className={showPasswordChange ? 'secondary-btn' : 'primary-btn'}
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setPasswordError('');
                setPasswordSuccess('');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {showPasswordChange ? 'Close' : 'Change Password'}
            </button>
          </div>

          {showPasswordChange && (
            <div>
              {passwordError && <div className="error-box">{passwordError}</div>}
              {passwordSuccess && <div className="success-box">{passwordSuccess}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="primary-btn"
                  onClick={handlePasswordSubmit}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                  }}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyProfile;
