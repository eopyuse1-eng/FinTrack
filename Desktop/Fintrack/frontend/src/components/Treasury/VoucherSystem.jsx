import React, { useState, useEffect } from 'react';

function VoucherSystem() {
  const [vouchers, setVouchers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    voucherCode: '',
    voucherType: 'travel',
    totalStock: '',
    voucherValue: '',
    validFrom: '',
    validUntil: '',
    lowStockThreshold: 10,
    description: '',
  });

  useEffect(() => {
    fetchVouchers();
  }, [filter]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? 'http://localhost:5000/api/vouchers' 
        : `http://localhost:5000/api/vouchers?status=${filter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setVouchers(data.data);
        setError('');
      }
    } catch (err) {
      setError('Failed to fetch vouchers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalStock' || name === 'voucherValue' || name === 'lowStockThreshold'
        ? parseInt(value) || ''
        : value
    }));
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/vouchers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Voucher created successfully!');
        setFormData({
          voucherCode: '',
          voucherType: 'travel',
          totalStock: '',
          voucherValue: '',
          validFrom: '',
          validUntil: '',
          lowStockThreshold: 10,
          description: '',
        });
        setShowForm(false);
        fetchVouchers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create voucher');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (voucher) => {
    const percentage = Math.round((voucher.availableStock / voucher.totalStock) * 100);
    if (percentage === 0) return 'empty';
    if (percentage <= 25) return 'critical';
    if (percentage <= 50) return 'low';
    if (percentage <= 75) return 'medium';
    return 'high';
  };

  const getStatusColor = (status) => {
    const colors = {
      critical: '#d32f2f',
      low: '#f57c00',
      medium: '#fbc02d',
      high: '#388e3c',
      empty: '#757575',
    };
    return colors[status] || '#757575';
  };

  return (
    <div className="voucher-system-section">
      <div className="section-header">
        <h2>🎟️ Voucher Management System</h2>
        <p>Create and manage voucher stocks with real-time tracking</p>
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

      {/* Filter and Action Buttons */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {showForm ? '✕ Cancel' : '+ Create Voucher Batch'}
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'active', 'paused', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                background: filter === status ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                color: filter === status ? 'white' : '#4b5563',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: filter === status ? '600' : '500',
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreateVoucher}
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#667eea' }}>
            Create New Voucher Batch
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Voucher Code *
              </label>
              <input
                type="text"
                name="voucherCode"
                value={formData.voucherCode}
                onChange={handleInputChange}
                placeholder="e.g., VOUCH-0001-2024"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Voucher Type *
              </label>
              <select
                name="voucherType"
                value={formData.voucherType}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              >
                <option value="travel">Travel</option>
                <option value="meal">Meal</option>
                <option value="accommodation">Accommodation</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Total Stock *
              </label>
              <input
                type="number"
                name="totalStock"
                value={formData.totalStock}
                onChange={handleInputChange}
                min="1"
                required
                placeholder="e.g., 100"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Voucher Value (₱) *
              </label>
              <input
                type="number"
                name="voucherValue"
                value={formData.voucherValue}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                placeholder="e.g., 500"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Valid From *
              </label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Valid Until *
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Low Stock Threshold
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                min="1"
                placeholder="10"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Additional notes about this voucher batch..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating...' : '✓ Create Voucher Batch'}
            </button>
          </div>
        </form>
      )}

      {/* Vouchers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loading && vouchers.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>Loading vouchers...</p>
        ) : vouchers.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>No vouchers found</p>
        ) : (
          vouchers.map(voucher => {
            const stockStatus = getStockStatus(voucher);
            const stockPercentage = Math.round((voucher.availableStock / voucher.totalStock) * 100);

            return (
              <div
                key={voucher._id}
                style={{
                  backgroundColor: 'white',
                  border: `2px solid ${getStatusColor(stockStatus)}`,
                  borderRadius: '8px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={() => setSelectedVoucher(voucher)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#667eea' }}>
                      {voucher.voucherCode}
                    </h3>
                    <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                      {voucher.voucherType.charAt(0).toUpperCase() + voucher.voucherType.slice(1)} • ₱{voucher.voucherValue}
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.4rem 0.8rem',
                      backgroundColor: voucher.status === 'active' ? '#e8f5e9' : '#f5f5f5',
                      color: voucher.status === 'active' ? '#2e7d32' : '#666',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                    }}
                  >
                    {voucher.status.toUpperCase()}
                  </span>
                </div>

                {/* Stock Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Stock</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      {voucher.availableStock} / {voucher.totalStock} ({stockPercentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${stockPercentage}%`,
                        backgroundColor: getStatusColor(stockStatus),
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#999' }}>Used</span>
                    <span style={{ fontWeight: '600' }}>{voucher.usedStock}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#999' }}>Expired</span>
                    <span style={{ fontWeight: '600' }}>{voucher.expiredStock}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#999' }}>
                  Valid until: {new Date(voucher.validUntil).toLocaleDateString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedVoucher && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedVoucher(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#667eea' }}>{selectedVoucher.voucherCode}</h2>
              <button
                onClick={() => setSelectedVoucher(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#999' }}>Type</p>
                <p style={{ margin: 0, fontWeight: '600' }}>
                  {selectedVoucher.voucherType.charAt(0).toUpperCase() + selectedVoucher.voucherType.slice(1)}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#999' }}>Value</p>
                <p style={{ margin: 0, fontWeight: '600' }}>₱{selectedVoucher.voucherValue}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#999' }}>Total Stock</p>
                <p style={{ margin: 0, fontWeight: '600' }}>{selectedVoucher.totalStock}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#999' }}>Available</p>
                <p style={{ margin: 0, fontWeight: '600', color: getStatusColor(getStockStatus(selectedVoucher)) }}>
                  {selectedVoucher.availableStock}
                </p>
              </div>
            </div>

            {selectedVoucher.description && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#999' }}>Description</p>
                <p style={{ margin: 0 }}>{selectedVoucher.description}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Use Vouchers
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  border: '1px solid #2e7d32',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Replenish Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoucherSystem;
