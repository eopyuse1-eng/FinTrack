import React, { useState, useEffect } from 'react';

function VoucherNotifications() {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockVouchers, setLowStockVouchers] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(fetchLowStockVouchers, 30000); // Check every 30 seconds
    fetchLowStockVouchers(); // Initial fetch
    return () => clearInterval(timer);
  }, []);

  const fetchLowStockVouchers = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Only fetch if user is treasury or hr_head
      if (user.role !== 'employee' && user.role !== 'hr_head') return;
      if (user.role === 'employee' && user.department !== 'treasury') return;

      const response = await fetch('http://localhost:5000/api/vouchers/low-stock', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setLowStockVouchers(data.data);
        setLowStockCount(data.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch low stock vouchers:', err);
    }
  };

  if (lowStockCount === 0) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={{
          position: 'relative',
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: '0.5rem',
        }}
        title="Voucher Alerts"
      >
        🎟️
        {lowStockCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#d32f2f',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {lowStockCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '300px',
            maxWidth: '400px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '0.5rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid #eee',
              fontWeight: '600',
              color: '#d32f2f',
            }}
          >
            ⚠️ Low Stock Alerts ({lowStockCount})
          </div>

          {lowStockVouchers.map(voucher => {
            const stockPercentage = Math.round(
              (voucher.availableStock / voucher.totalStock) * 100
            );

            return (
              <div
                key={voucher._id}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong style={{ color: '#667eea' }}>{voucher.voucherCode}</strong>
                  <span style={{ color: '#d32f2f', fontWeight: '600' }}>
                    {stockPercentage}%
                  </span>
                </div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>
                  {voucher.availableStock} / {voucher.totalStock} available
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    height: '6px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${stockPercentage}%`,
                      backgroundColor: '#d32f2f',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VoucherNotifications;
