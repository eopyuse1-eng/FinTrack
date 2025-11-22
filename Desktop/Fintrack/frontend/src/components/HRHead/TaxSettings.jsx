import React, { useState, useEffect } from 'react';
import '../../styles/Dashboards.css';

function TaxSettings() {
  const [taxSettings, setTaxSettings] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTaxSettings();
  }, []);

  const fetchTaxSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tax-settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Handle both 'settings' and 'data' response formats
          setTaxSettings(data.settings || data.data);
        }
      } else {
        setMessage('✕ Error fetching tax settings');
      }
    } catch (err) {
      console.error('Error fetching tax settings:', err);
      setMessage('✕ Error fetching tax settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setTempValue(taxSettings[field] ? taxSettings[field].toString() : '');
  };

  const handleSaveField = async (field) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build complete payload with all required fields
      const updatePayload = {
        minimumTaxableIncome: taxSettings.minimumTaxableIncome || 250000,
        taxExemptionEnabled: taxSettings.taxExemptionEnabled !== undefined ? taxSettings.taxExemptionEnabled : true,
        autoApplyExemption: taxSettings.autoApplyExemption !== undefined ? taxSettings.autoApplyExemption : true,
      };
      
      // Update the field being edited
      if (field === 'taxExemptionEnabled' || field === 'autoApplyExemption') {
        updatePayload[field] = tempValue === 'true';
      } else {
        updatePayload[field] = isNaN(tempValue) ? tempValue : parseFloat(tempValue);
      }

      console.log('Sending payload:', updatePayload);

      const response = await fetch('http://localhost:5000/api/tax-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTaxSettings(data.settings || data.data);
        setEditingField(null);
        setMessage('✓ Tax setting updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`✕ Error: ${data.message || 'Failed to update tax setting'}`);
      }
    } catch (err) {
      console.error('Error saving tax settings:', err);
      setMessage('✕ Error updating tax setting');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const fieldLabels = {
    minimumTaxableIncome: 'Minimum Taxable Income (₱)',
    taxExemptionEnabled: 'Tax Exemption Enabled',
    autoApplyExemption: 'Auto-Apply Exemption',
  };

  const fieldDescriptions = {
    minimumTaxableIncome: 'Minimum annual income threshold for taxation. Employees below this are tax-exempt.',
    taxExemptionEnabled: 'Enable tax exemption for employees below the threshold.',
    autoApplyExemption: 'Automatically apply exemption rules to all employees.',
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div className="section-header">
        <h2>Tax Settings (HR Head)</h2>
        <p>Configure company-wide tax and deduction rates</p>
      </div>

      {message && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            borderRadius: '4px',
            backgroundColor: message.includes('✓') ? '#d4edda' : '#f8d7da',
            color: message.includes('✓') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('✓') ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading tax settings...</p>
      ) : !taxSettings ? (
        <p>No tax settings available. Please check the backend.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
        }}>
          {Object.entries(fieldLabels).map(([field, label]) => {
            const isBoolean = field === 'taxExemptionEnabled' || field === 'autoApplyExemption';
            const currentValue = taxSettings[field];
            
            return (
              <div
                key={field}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
              >
                <h4 style={{ marginBottom: '0.5rem' }}>{label}</h4>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  {fieldDescriptions[field]}
                </p>

                {editingField === field ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      {isBoolean ? (
                        <select
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '1rem',
                          }}
                        >
                          <option value="true">Yes (Enabled)</option>
                          <option value="false">No (Disabled)</option>
                        </select>
                      ) : (
                        <>
                          <input
                            type="number"
                            step="10000"
                            min="0"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: '4px',
                              border: '1px solid #ddd',
                              fontSize: '1rem',
                            }}
                          />
                          <small style={{ color: '#999' }}>Enter amount in Philippine Peso</small>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleSaveField(field)}
                      disabled={loading}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        border: '2px solid #007bff',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                        {isBoolean ? (currentValue ? '✓ Yes' : '✕ No') : `₱${(currentValue || 0).toLocaleString('en-PH')}`}
                      </span>
                      <button
                        onClick={() => handleEditField(field)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        ✎ Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#e7f3ff',
        borderRadius: '8px',
        border: '1px solid #b3d9ff',
      }}>
        <h4 style={{ marginBottom: '0.5rem' }}>ℹ️ Information</h4>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
          <li>Tax exemption is applied to employees earning below the minimum threshold</li>
          <li>Changes apply to all future payroll calculations</li>
          <li>Enable auto-apply to automatically sync exemption rules to all employees</li>
          <li>All audit logs track tax setting modifications</li>
          <li>Exempted employees will not have tax withheld from their salaries</li>
        </ul>
      </div>
    </div>
  );
}

export default TaxSettings;
