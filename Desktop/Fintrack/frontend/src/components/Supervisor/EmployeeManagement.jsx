import React, { useState, useEffect } from 'react';

function EmployeeManagement() {
  const [hrHeads, setHrHeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedHrHead, setSelectedHrHead] = useState(null);
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    // Personal Details
    gender: '',
    birthdate: '',
    birthplace: '',
    maritalStatus: '',
    // Address
    address: '',
    city: '',
    municipality: '',
    province: '',
    zipCode: '',
    // Employment
    position: '',
    dateHired: '',
    // Government IDs
    sssNo: '',
    tin: '',
    philHealthNo: '',
    hdmfId: '',
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  // Load data from database on component mount
  useEffect(() => {
    const fetchSubordinates = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/subordinates', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const subordinates = data.subordinates || [];

          // Filter only hr_head role (users created by supervisor)
          const hrHeadsList = subordinates.filter(user => user.role === 'hr_head');

          setHrHeads(hrHeadsList);
        }
      } catch (error) {
        console.error('Error fetching HR Heads:', error);
      }
    };

    if (token) {
      fetchSubordinates();
    }
  }, [token]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('supervisorCreatedHrHeads', JSON.stringify(hrHeads));
  }, [hrHeads]);

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

    // Age validation - must be 18 or older
    if (formData.birthdate) {
      const birthDate = new Date(formData.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        setError(`Employee must be at least 18 years old. Current age: ${age}`);
        return false;
      }
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
          role: 'hr_head',
          middleName: formData.middleName,
          mobileNumber: formData.mobileNumber,
          gender: formData.gender,
          birthdate: formData.birthdate,
          birthplace: formData.birthplace,
          maritalStatus: formData.maritalStatus,
          address: formData.address,
          city: formData.city,
          municipality: formData.municipality,
          province: formData.province,
          zipCode: formData.zipCode,
          position: formData.position,
          dateHired: formData.dateHired,
          sssNo: formData.sssNo,
          tin: formData.tin,
          philHealthNo: formData.philHealthNo,
          hdmfId: formData.hdmfId,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`HR Head created successfully: ${data.user.email}`);
        const newHrHead = { ...data.user, isActive: data.user.isActive !== false };
        setHrHeads([...hrHeads, newHrHead]);
        
        // Save to localStorage for birthday notifications
        const existingHrHeads = JSON.parse(localStorage.getItem('hrHeads') || '[]');
        existingHrHeads.push(newHrHead);
        localStorage.setItem('hrHeads', JSON.stringify(existingHrHeads));
        
        setFormData({
          firstName: '',
          lastName: '',
          middleName: '',
          email: '',
          password: '',
          confirmPassword: '',
          mobileNumber: '',
          gender: '',
          birthdate: '',
          birthplace: '',
          maritalStatus: '',
          address: '',
          city: '',
          municipality: '',
          province: '',
          zipCode: '',
          position: '',
          dateHired: '',
          sssNo: '',
          tin: '',
          philHealthNo: '',
          hdmfId: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
        });
        setShowForm(false);
      } else {
        setError(data.message || 'Error creating HR Head');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-management-section">
      <div className="section-header">
        <h2>Employee Management</h2>
        <p>Create and manage HR Heads</p>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {!showForm ? (
        <button
          className="primary-btn"
          onClick={() => setShowForm(true)}
        >
          + Create HR Head
        </button>
      ) : (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="employee-form">
            {/* Basic Information */}
            <h3 className="form-section-title">Basic Information</h3>
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
                <label htmlFor="middleName">Middle Name</label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  placeholder="Enter middle name"
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

            <div className="form-row">
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
              <div className="form-group">
                <label htmlFor="mobileNumber">Mobile Number</label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="+63XXXXXXXXXX"
                  disabled={loading}
                />
              </div>
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

            {/* Personal Information */}
            <h3 className="form-section-title">Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="birthdate">Birthdate</label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="birthplace">Birthplace</label>
                <input
                  type="text"
                  id="birthplace"
                  name="birthplace"
                  value={formData.birthplace}
                  onChange={handleInputChange}
                  placeholder="Enter birthplace"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maritalStatus">Marital Status</label>
                <select
                  id="maritalStatus"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Select Marital Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>

            {/* Address Information */}
            <h3 className="form-section-title">Address Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="municipality">Municipality</label>
                <input
                  type="text"
                  id="municipality"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  placeholder="Enter municipality"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="province">Province</label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  placeholder="Enter province"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="zipCode">Zip Code</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="Enter zip code"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Employment Information */}
            <h3 className="form-section-title">Employment Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Enter position"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="dateHired">Date Hired</label>
                <input
                  type="date"
                  id="dateHired"
                  name="dateHired"
                  value={formData.dateHired}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Government IDs */}
            <h3 className="form-section-title">Government IDs</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sssNo">SSS Number</label>
                <input
                  type="text"
                  id="sssNo"
                  name="sssNo"
                  value={formData.sssNo}
                  onChange={handleInputChange}
                  placeholder="Enter SSS number"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="tin">TIN</label>
                <input
                  type="text"
                  id="tin"
                  name="tin"
                  value={formData.tin}
                  onChange={handleInputChange}
                  placeholder="Enter TIN"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="philHealthNo">PhilHealth Number</label>
                <input
                  type="text"
                  id="philHealthNo"
                  name="philHealthNo"
                  value={formData.philHealthNo}
                  onChange={handleInputChange}
                  placeholder="Enter PhilHealth number"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="hdmfId">HDMF ID</label>
                <input
                  type="text"
                  id="hdmfId"
                  name="hdmfId"
                  value={formData.hdmfId}
                  onChange={handleInputChange}
                  placeholder="Enter HDMF ID"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <h3 className="form-section-title">Emergency Contact</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="emergencyContactName">Emergency Contact Name</label>
                <input
                  type="text"
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact name"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="emergencyContactPhone">Emergency Contact Phone</label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact phone"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create HR Head'}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="hr-heads-list">
        <h3>HR Heads</h3>
        {hrHeads.length > 0 ? (
          <div className="heads-grid">
            {hrHeads.map(head => (
              <button 
                key={head._id || head.id} 
                className="head-card"
                onClick={() => {
                  setSelectedHrHead(head);
                  setFormData({
                    firstName: head.firstName || '',
                    lastName: head.lastName || '',
                    middleName: head.middleName || '',
                    email: head.email || '',
                    password: '',
                    confirmPassword: '',
                    mobileNumber: head.mobileNumber || '',
                    gender: head.gender || '',
                    birthdate: head.birthdate ? head.birthdate.split('T')[0] : '',
                    birthplace: head.birthplace || '',
                    maritalStatus: head.maritalStatus || '',
                    address: head.address || '',
                    city: head.city || '',
                    municipality: head.municipality || '',
                    province: head.province || '',
                    zipCode: head.zipCode || '',
                    position: head.position || '',
                    dateHired: head.dateHired ? head.dateHired.split('T')[0] : '',
                    sssNo: head.sssNo || '',
                    tin: head.tin || '',
                    philHealthNo: head.philHealthNo || '',
                    hdmfId: head.hdmfId || '',
                    emergencyContactName: head.emergencyContactName || '',
                    emergencyContactPhone: head.emergencyContactPhone || '',
                  });
                  setShowForm(true);
                }}
                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                <div className="card-header">
                  <h4>{head.firstName} {head.lastName}</h4>
                  <span className="role-badge">{head.role}</span>
                </div>
                <div className="card-body">
                  <p><strong>Email:</strong> {head.email}</p>
                  <p><strong>Status:</strong> {head.isActive ? 'Active' : 'Inactive'}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Click to edit</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No HR Heads created yet.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedHrHead && !showForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedHrHead(null)}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            padding: '2rem', 
            maxWidth: '600px', 
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>{selectedHrHead.firstName} {selectedHrHead.lastName}</h2>
              <button 
                onClick={() => setSelectedHrHead(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1.5rem', 
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              {/* Basic Information */}
              <div>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Basic Information</h4>
                <p><strong>First Name:</strong> {selectedHrHead.firstName}</p>
                <p><strong>Middle Name:</strong> {selectedHrHead.middleName || 'N/A'}</p>
                <p><strong>Last Name:</strong> {selectedHrHead.lastName}</p>
                <p><strong>Email:</strong> {selectedHrHead.email}</p>
                <p><strong>Mobile:</strong> {selectedHrHead.mobileNumber || 'N/A'}</p>
              </div>

              {/* Personal Details */}
              <div>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Personal Details</h4>
                <p><strong>Gender:</strong> {selectedHrHead.gender || 'N/A'}</p>
                <p><strong>Birthdate:</strong> {selectedHrHead.birthdate ? new Date(selectedHrHead.birthdate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Birthplace:</strong> {selectedHrHead.birthplace || 'N/A'}</p>
                <p><strong>Marital Status:</strong> {selectedHrHead.maritalStatus || 'N/A'}</p>
              </div>

              {/* Address */}
              <div>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Address</h4>
                <p><strong>Address:</strong> {selectedHrHead.address || 'N/A'}</p>
                <p><strong>City:</strong> {selectedHrHead.city || 'N/A'}</p>
                <p><strong>Municipality:</strong> {selectedHrHead.municipality || 'N/A'}</p>
                <p><strong>Province:</strong> {selectedHrHead.province || 'N/A'}</p>
                <p><strong>Zip Code:</strong> {selectedHrHead.zipCode || 'N/A'}</p>
              </div>

              {/* Employment */}
              <div>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Employment</h4>
                <p><strong>Role:</strong> {selectedHrHead.role}</p>
                <p><strong>Department:</strong> {selectedHrHead.department || 'N/A'}</p>
                <p><strong>Position:</strong> {selectedHrHead.position || 'N/A'}</p>
                <p><strong>Date Hired:</strong> {selectedHrHead.dateHired ? new Date(selectedHrHead.dateHired).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Status:</strong> <span style={{ color: selectedHrHead.isActive ? 'var(--color-success)' : 'var(--color-error)' }}>{selectedHrHead.isActive ? '✓ Active' : '✗ Inactive'}</span></p>
              </div>

              {/* Government IDs */}
              <div>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Government IDs</h4>
                <p><strong>SSS No:</strong> {selectedHrHead.sssNo || 'N/A'}</p>
                <p><strong>TIN:</strong> {selectedHrHead.tin || 'N/A'}</p>
                <p><strong>PhilHealth No:</strong> {selectedHrHead.philHealthNo || 'N/A'}</p>
                <p><strong>HDMF ID:</strong> {selectedHrHead.hdmfId || 'N/A'}</p>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Emergency Contact</h4>
                <p><strong>Name:</strong> {selectedHrHead.emergencyContactName || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedHrHead.emergencyContactPhone || 'N/A'}</p>
              </div>
            </div>

            <button 
              onClick={() => setSelectedHrHead(null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManagement;
