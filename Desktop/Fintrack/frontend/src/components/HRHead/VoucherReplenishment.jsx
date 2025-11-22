import React, { useState, useEffect } from 'react';

function VoucherReplenishment() {
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [replenishData, setReplenishData] = useState({
    quantity: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('low-stock');

  useEffect(() => {
    fetchVouchers();
  }, [activeTab]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = activeTab === 'low-stock'
        ? 'http://localhost:5000/api/vouchers/low-stock'
        : 'http://localhost:5000/api/vouchers?status=active';

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

  const handleReplenish = async (e) => {
    e.preventDefault();
    
    if (!selectedVoucher || !replenishData.quantity) {
      setError('Please select a voucher and enter quantity');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/vouchers/${selectedVoucher._id}/replenish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quantity: parseInt(replenishData.quantity),
            description: replenishData.description || 'Stock replenishment by HR Head',
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess(`Successfully replenished ${replenishData.quantity} units!`);
        setReplenishData({ quantity: '', description: '' });
        setSelectedVoucher(null);
        fetchVouchers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to replenish voucher');
      }
    } catch (err) {
      setError('Failed to replenish voucher');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (voucher) => {
    const percentage = Math.round((voucher.availableStock / voucher.totalStock) * 100);
    if (percentage === 0) return { text: 'EMPTY', color: '#d32f2f' };
    if (percentage <= 25) return { text: 'CRITICAL', color: '#d32f2f' };
    if (percentage <= 50) return { text: 'LOW', color: '#f57c00' };
    if (percentage <= 75) return { text: 'MEDIUM', color: '#fbc02d' };
    return { text: 'HIGH', color: '#388e3c' };
  };

  return (
    <div className="voucher-replenishment-section">
      <div className="section-header">
        <h2>🔄 Voucher Replenishment Center</h2>
        <p>Monitor and replenish low-stock vouchers to ensure continuous operations</p>
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

      {/* Tab Navigation */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('low-stock')}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: activeTab === 'low-stock' ? '#667eea' : 'transparent',
            color: activeTab === 'low-stock' ? 'white' : '#4b5563',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'low-stock' ? '600' : '500',
          }}
        >
          ⚠️ Low Stock ({vouchers.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: activeTab === 'all' ? '#667eea' : 'transparent',
            color: activeTab === 'all' ? 'white' : '#4b5563',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'all' ? '600' : '500',
          }}
        >
          📋 All Active Vouchers
        </button>
      </div>

      {/* Voucher Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {loading && vouchers.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>Loading vouchers...</p>
        ) : vouchers.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>
            {activeTab === 'low-stock' ? 'No low-stock vouchers found' : 'No active vouchers found'}
          </p>
        ) : (
          vouchers.map(voucher => {
            const status = getStockStatus(voucher);
            const stockPercentage = Math.round((voucher.availableStock / voucher.totalStock) * 100);

            return (
              <div
                key={voucher._id}
                onClick={() => setSelectedVoucher(voucher)}
                style={{
                  backgroundColor: 'white',
                  border: `2px solid ${status.color}`,
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
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
                      backgroundColor: status.color,
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                    }}
                  >
                    {status.text}
                  </span>
                </div>

                {/* Stock Progress Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Stock Level</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      {voucher.availableStock} / {voucher.totalStock}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '10px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '5px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${stockPercentage}%`,
                        backgroundColor: status.color,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                    {stockPercentage}% Available
                  </p>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#666',
                  borderTop: '1px solid #eee',
                  paddingTop: '1rem',
                }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#999' }}>Used</span>
                    <span style={{ fontWeight: '600' }}>{voucher.usedStock}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#999' }}>Expired</span>
                    <span style={{ fontWeight: '600' }}>{voucher.expiredStock}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#999' }}>Threshold</span>
                    <span style={{ fontWeight: '600' }}>{voucher.lowStockThreshold}</span>
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

      {/* Replenishment Modal */}
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
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#667eea' }}>
              Replenish: {selectedVoucher.voucherCode}
            </h2>

            {/* Current Status */}
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#999' }}>Current Available</p>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '1.25rem', color: '#667eea' }}>
                    {selectedVoucher.availableStock}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#999' }}>Total Stock</p>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '1.25rem' }}>
                    {selectedVoucher.totalStock}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleReplenish}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  value={replenishData.quantity}
                  onChange={(e) => setReplenishData({ ...replenishData, quantity: e.target.value })}
                  min="1"
                  required
                  placeholder="Enter number of units"
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={replenishData.description}
                  onChange={(e) => setReplenishData({ ...replenishData, description: e.target.value })}
                  placeholder="Reason for replenishment or additional notes..."
                  rows="3"
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

              {/* Preview of new totals */}
              {replenishData.quantity && (
                <div style={{
                  backgroundColor: '#e8f5e9',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1.5rem',
                  borderLeft: '4px solid #4caf50',
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#2e7d32', fontWeight: '600' }}>
                    📊 After Replenishment:
                  </p>
                  <p style={{ margin: 0, color: '#2e7d32' }}>
                    New Available: {selectedVoucher.availableStock + parseInt(replenishData.quantity || 0)} units
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={loading || !replenishData.quantity}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading || !replenishData.quantity ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: loading || !replenishData.quantity ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Processing...' : '✓ Confirm Replenishment'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVoucher(null)}
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
        </div>
      )}
    </div>
  );
}

export default VoucherReplenishment;
