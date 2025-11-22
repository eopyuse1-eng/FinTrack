import React, { useState, useEffect } from 'react';

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [hrStaff, setHrStaff] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null); // 'employee' or 'hr_staff'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  const [formData, setFormData] = useState({
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
    department: 'admin',
    sssNo: '',
    tin: '',
    philHealthNo: '',
    hdmfId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const token = localStorage.getItem('token');

  // Load data from database on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/all-employees', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const allUsers = data.employees || [];

          // Filter into employees and hr_staff
          const empList = allUsers.filter(user => user.role === 'employee');
          const staffList = allUsers.filter(user => user.role === 'hr_staff');

          setEmployees(empList);
          setHrStaff(staffList);

          localStorage.setItem('hrHeadEmployees', JSON.stringify(empList));
          localStorage.setItem('hrHeadStaff', JSON.stringify(staffList));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        // Load from localStorage if available
        const cachedEmp = localStorage.getItem('hrHeadEmployees');
        const cachedStaff = localStorage.getItem('hrHeadStaff');
        if (cachedEmp) setEmployees(JSON.parse(cachedEmp));
        if (cachedStaff) setHrStaff(JSON.parse(cachedStaff));
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

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

    // Age validation
    if (formData.birthdate) {
      const birthDate = new Date(formData.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        setError(`User must be at least 18 years old. Current age: ${age}`);
        return false;
      }
    }

    // Department validation for employees only
    if (formType === 'employee') {
      if (!formData.department || formData.department === 'admin') {
        setError('Please select a valid department (Marketing or Treasury)');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        email: formData.email,
        password: formData.password,
        role: formType === 'employee' ? 'employee' : 'hr_staff',
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
      };

      // Only include department for employees
      if (formType === 'employee') {
        payload.department = formData.department;
      }

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`${formType === 'employee' ? 'Employee' : 'HR Staff'} created successfully!`);
        const newUser = { ...data.user, isActive: data.user.isActive !== false };
        
        if (formType === 'employee') {
          setEmployees([...employees, newUser]);
          localStorage.setItem('hrHeadEmployees', JSON.stringify([...employees, newUser]));
        } else {
          setHrStaff([...hrStaff, newUser]);
          localStorage.setItem('hrHeadStaff', JSON.stringify([...hrStaff, newUser]));
        }

        resetForm();
        setShowForm(false);
        setFormType(null);

        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error creating user');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
      department: 'admin',
      sssNo: '',
      tin: '',
      philHealthNo: '',
      hdmfId: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    });
  };

  const handleEditUser = () => {
    setEditFormData({ ...selectedUser });
    setIsEditingUser(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/auth/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the selectedUser to reflect changes
        setSelectedUser(data.user);
        
        // Update the employee or hrStaff list
        if (selectedUser.role === 'employee') {
          const updatedEmployees = employees.map(emp => 
            emp._id === selectedUser._id ? data.user : emp
          );
          setEmployees(updatedEmployees);
          localStorage.setItem('hrHeadEmployees', JSON.stringify(updatedEmployees));
        } else if (selectedUser.role === 'hr_staff') {
          const updatedStaff = hrStaff.map(staff => 
            staff._id === selectedUser._id ? data.user : staff
          );
          setHrStaff(updatedStaff);
          localStorage.setItem('hrHeadStaff', JSON.stringify(updatedStaff));
        }
        
        setSuccess('User information updated successfully!');
        setIsEditingUser(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error updating user');
      }
    } catch (err) {
      setError('Error connecting to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingUser(false);
    setEditFormData({});
    setError('');
  };

  return (
    <div className="employee-management-section">
      <div className="section-header">
        <h2>Employee Management</h2>
        <p>Create and manage HR Staff and Employees</p>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {!showForm ? (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            className="primary-btn"
            onClick={() => {
              setFormType('employee');
              setShowForm(true);
              resetForm();
            }}
          >
            + Create Employee
          </button>
          <button
            className="primary-btn"
            onClick={() => {
              setFormType('hr_staff');
              setShowForm(true);
              resetForm();
            }}
            style={{ backgroundColor: '#667eea' }}
          >
            + Create HR Staff
          </button>
        </div>
      ) : (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="employee-form">
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
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
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
                  placeholder="Enter mobile number"
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
                  placeholder="Enter password (min 6 chars)"
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

            <h3 className="form-section-title">Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select name="gender" id="gender" value={formData.gender} onChange={handleInputChange} disabled={loading}>
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
              <div className="form-group">
                <label htmlFor="maritalStatus">Marital Status</label>
                <select name="maritalStatus" id="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} disabled={loading}>
                  <option value="">Select Marital Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>

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
            </div>

            <div className="form-row">
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
              {formType === 'employee' && (
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <select name="department" id="department" value={formData.department} onChange={handleInputChange} disabled={loading}>
                    <option value="admin">Select Department</option>
                    <option value="marketing">Marketing</option>
                    <option value="treasury">Treasury</option>
                  </select>
                </div>
              )}
              {formType === 'hr_staff' && (
                <div className="form-group" style={{ backgroundColor: '#f0f4ff', padding: '1rem', borderRadius: '4px', border: '1px solid #d0d9ff' }}>
                  <p style={{ fontSize: '0.9rem', color: '#004085', margin: 0 }}>
                    ℹ️ HR Staff will be assigned to HR department automatically
                  </p>
                </div>
              )}
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
              <button type="submit" className="primary-btn" disabled={loading} style={{ backgroundColor: formType === 'hr_staff' ? '#667eea' : '#28a745' }}>
                {loading ? 'Creating...' : `Create ${formType === 'employee' ? 'Employee' : 'HR Staff'}`}
              </button>
              <button type="button" className="secondary-btn" onClick={() => { setShowForm(false); setFormType(null); resetForm(); }} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees Section */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Employees ({employees.length})</h3>
        {employees.length > 0 ? (
          <div className="heads-grid">
            {employees.map(emp => (
              <button 
                key={emp._id || emp.id}
                onClick={() => setSelectedUser(emp)}
                className="head-card"
                style={{ cursor: 'pointer', border: 'none', padding: 0, background: 'none' }}
              >
                <div className="card-header">
                  <h4>{emp.firstName} {emp.lastName}</h4>
                  <span className="role-badge">Employee</span>
                </div>
                <div className="card-body">
                  <p><strong>Email:</strong> {emp.email}</p>
                  <p><strong>Department:</strong> {emp.department || 'N/A'}</p>
                  <p><strong>Position:</strong> {emp.position || 'N/A'}</p>
                  <p><strong>Status:</strong> {emp.isActive ? '✓ Active' : '✕ Inactive'}</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>Click to view details</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No employees created yet.</p>
          </div>
        )}
      </div>

      {/* HR Staff Section */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>HR Staff ({hrStaff.length})</h3>
        {hrStaff.length > 0 ? (
          <div className="heads-grid">
            {hrStaff.map(staff => (
              <button 
                key={staff._id || staff.id}
                onClick={() => setSelectedUser(staff)}
                className="head-card"
                style={{ cursor: 'pointer', border: 'none', padding: 0, background: 'none', borderLeft: '4px solid #667eea' }}
              >
                <div className="card-header">
                  <h4>{staff.firstName} {staff.lastName}</h4>
                  <span className="role-badge" style={{ backgroundColor: '#667eea' }}>HR Staff</span>
                </div>
                <div className="card-body">
                  <p><strong>Email:</strong> {staff.email}</p>
                  <p><strong>Position:</strong> {staff.position || 'N/A'}</p>
                  <p><strong>Status:</strong> {staff.isActive ? '✓ Active' : '✕ Inactive'}</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>Click to view details</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No HR Staff created yet.</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
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
        }} onClick={() => { setSelectedUser(null); setIsEditingUser(false); }}>
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
              <h2>{selectedUser.firstName} {selectedUser.lastName}</h2>
              <button 
                onClick={() => { setSelectedUser(null); setIsEditingUser(false); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1.5rem', 
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ 
                backgroundColor: '#f8d7da', 
                color: '#721c24', 
                padding: '1rem', 
                borderRadius: '4px', 
                marginBottom: '1rem' 
              }}>
                ❌ {error}
              </div>
            )}

            {success && (
              <div style={{ 
                backgroundColor: '#d4edda', 
                color: '#155724', 
                padding: '1rem', 
                borderRadius: '4px', 
                marginBottom: '1rem' 
              }}>
                ✅ {success}
              </div>
            )}

            {!isEditingUser ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <h4 style={{ color: '#667eea', marginBottom: '1rem' }}>Basic Information</h4>
                    <p><strong>First Name:</strong> {selectedUser.firstName}</p>
                    <p><strong>Middle Name:</strong> {selectedUser.middleName || 'N/A'}</p>
                    <p><strong>Last Name:</strong> {selectedUser.lastName}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Mobile:</strong> {selectedUser.mobileNumber || 'N/A'}</p>
                  </div>

                  <div>
                    <h4 style={{ color: '#667eea', marginBottom: '1rem' }}>Personal Details</h4>
                    <p><strong>Gender:</strong> {selectedUser.gender || 'N/A'}</p>
                    <p><strong>Birthdate:</strong> {selectedUser.birthdate ? new Date(selectedUser.birthdate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Birthplace:</strong> {selectedUser.birthplace || 'N/A'}</p>
                    <p><strong>Marital Status:</strong> {selectedUser.maritalStatus || 'N/A'}</p>
                  </div>

                  <div>
                    <h4 style={{ color: '#667eea', marginBottom: '1rem' }}>Employment</h4>
                    <p><strong>Position:</strong> {selectedUser.position || 'N/A'}</p>
                    <p><strong>Department:</strong> {selectedUser.department || 'N/A'}</p>
                    <p><strong>Date Hired:</strong> {selectedUser.dateHired ? new Date(selectedUser.dateHired).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Status:</strong> <span style={{ color: selectedUser.isActive ? '#28a745' : '#dc3545' }}>{selectedUser.isActive ? '✓ Active' : '✗ Inactive'}</span></p>
                  </div>

                  <div>
                    <h4 style={{ color: '#667eea', marginBottom: '1rem' }}>Government IDs</h4>
                    <p><strong>SSS:</strong> {selectedUser.sssNo || 'N/A'}</p>
                    <p><strong>TIN:</strong> {selectedUser.tin || 'N/A'}</p>
                    <p><strong>PhilHealth:</strong> {selectedUser.philHealthNo || 'N/A'}</p>
                    <p><strong>HDMF:</strong> {selectedUser.hdmfId || 'N/A'}</p>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <h4 style={{ color: '#667eea', marginBottom: '1rem' }}>Emergency Contact</h4>
                    <p><strong>Name:</strong> {selectedUser.emergencyContactName || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedUser.emergencyContactPhone || 'N/A'}</p>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <h4 style={{ color: '#667eea', marginBottom: '1rem' }}>Address</h4>
                    <p><strong>Address:</strong> {selectedUser.address || 'N/A'}</p>
                    <p><strong>City:</strong> {selectedUser.city || 'N/A'}</p>
                    <p><strong>Municipality:</strong> {selectedUser.municipality || 'N/A'}</p>
                    <p><strong>Province:</strong> {selectedUser.province || 'N/A'}</p>
                    <p><strong>Zip Code:</strong> {selectedUser.zipCode || 'N/A'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={handleEditUser}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#667eea',
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
              </>
            ) : (
              <>
                <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editFormData.firstName || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={editFormData.lastName || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Middle Name</label>
                    <input
                      type="text"
                      name="middleName"
                      value={editFormData.middleName || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Mobile Number</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={editFormData.mobileNumber || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Gender</label>
                    <select
                      name="gender"
                      value={editFormData.gender || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Birthdate</label>
                    <input
                      type="date"
                      name="birthdate"
                      value={editFormData.birthdate ? editFormData.birthdate.split('T')[0] : ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Birthplace</label>
                    <input
                      type="text"
                      name="birthplace"
                      value={editFormData.birthplace || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Marital Status</label>
                    <select
                      name="maritalStatus"
                      value={editFormData.maritalStatus || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    >
                      <option value="">Select Marital Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Position</label>
                    <input
                      type="text"
                      name="position"
                      value={editFormData.position || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Date Hired</label>
                    <input
                      type="date"
                      name="dateHired"
                      value={editFormData.dateHired ? editFormData.dateHired.split('T')[0] : ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={editFormData.address || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>City</label>
                    <input
                      type="text"
                      name="city"
                      value={editFormData.city || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Municipality</label>
                    <input
                      type="text"
                      name="municipality"
                      value={editFormData.municipality || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Province</label>
                    <input
                      type="text"
                      name="province"
                      value={editFormData.province || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={editFormData.zipCode || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>SSS Number</label>
                    <input
                      type="text"
                      name="sssNo"
                      value={editFormData.sssNo || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>TIN</label>
                    <input
                      type="text"
                      name="tin"
                      value={editFormData.tin || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>PhilHealth Number</label>
                    <input
                      type="text"
                      name="philHealthNo"
                      value={editFormData.philHealthNo || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>HDMF ID</label>
                    <input
                      type="text"
                      name="hdmfId"
                      value={editFormData.hdmfId || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={editFormData.emergencyContactName || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Emergency Contact Phone</label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={editFormData.emergencyContactPhone || ''}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      disabled={loading}
                    />
                  </div>
                </form>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={handleSaveEdit}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Saving...' : '✓ Save Changes'}
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManagement;
