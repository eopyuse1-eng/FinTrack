import React, { useState, useEffect } from 'react';

function MarketingDashboard() {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [upcomingPrices, setUpcomingPrices] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState({
    price: '',
    effectiveDate: '',
    notes: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchPrices();
    // Refresh every 2 minutes
    const interval = setInterval(fetchPrices, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [currentRes, upcomingRes, historyRes] = await Promise.all([
        fetch('http://localhost:5000/api/gas-pricing/current', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/gas-pricing/upcoming', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/gas-pricing/history?days=30', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (currentRes.ok) {
        const data = await currentRes.json();
        setCurrentPrice(data.data);
      }

      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcomingPrices(data.data);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setPriceHistory(data.data);
      }

      setError('');
    } catch (err) {
      setError('Failed to fetch prices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    
    // Clear error first
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Ensure price is a number
      const numPrice = parseFloat(formData.price);
      if (!numPrice || numPrice <= 0) {
        setError('Price must be a valid number greater than 0');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/gas-pricing/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: numPrice,
          effectiveDate: formData.effectiveDate,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ price: '', effectiveDate: '', notes: '' });
        setShowUpdateForm(false);
        setError('');
        // Refresh data
        setTimeout(() => fetchPrices(), 500);
      } else {
        setError(data.message || 'Failed to update price');
      }
    } catch (err) {
      setError('Error updating price: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getGasPumpHeight = (price) => {
    if (!price) return 0;
    const maxPrice = Math.max(currentPrice?.price || 0, ...upcomingPrices.map(p => p.price || 0), 150);
    return (price / maxPrice) * 100;
  };

  const isHRHead = user?.role === 'hr_head';

  return (
    <div className="marketing-dashboard">
      <div className="section-header">
        <h2>⛽ Gas Pricing Dashboard</h2>
        <p>Real-time gas price updates for marketing and operations</p>
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

      {/* Current Price Display */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
          {/* Gas Pump Animation */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: '2rem',
              marginBottom: '2rem',
              height: '300px',
            }}>
              {/* Current Price Bar */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '250px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '8px',
                  border: '2px solid #667eea',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${getGasPumpHeight(currentPrice?.price)}%`,
                      backgroundColor: '#4caf50',
                      position: 'absolute',
                      bottom: 0,
                      transition: 'height 0.3s ease',
                    }}
                  />
                </div>
                <p style={{ marginTop: '1rem', fontWeight: '600', color: '#333' }}>TODAY</p>
              </div>

              {/* Next 3 Days */}
              {[0, 1, 2].map((dayOffset) => {
                const price = upcomingPrices[dayOffset];
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + dayOffset + 1);

                return (
                  <div key={dayOffset} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '60px',
                      height: '250px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '8px',
                      border: '2px solid #ffa726',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${getGasPumpHeight(price?.price)}%`,
                          backgroundColor: '#ff9800',
                          position: 'absolute',
                          bottom: 0,
                          transition: 'height 0.3s ease',
                        }}
                      />
                    </div>
                    <p style={{ marginTop: '1rem', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>
                      {futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price Information */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>Current Price</h3>
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#999' }}>Price per Liter</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#4caf50' }}>
                ₱{currentPrice?.price?.toFixed(2) || '0.00'}
              </p>
            </div>

            {currentPrice?.updatedBy && (
              <p style={{ margin: '1rem 0', fontSize: '0.9rem', color: '#666' }}>
                <strong>Updated by:</strong> {currentPrice.updatedBy.firstName} {currentPrice.updatedBy.lastName}
              </p>
            )}

            {currentPrice?.notes && (
              <p style={{ margin: '1rem 0', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                <strong>Notes:</strong> {currentPrice.notes}
              </p>
            )}

            {isHRHead && (
              <button
                onClick={() => setShowUpdateForm(!showUpdateForm)}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                {showUpdateForm ? '✕ Cancel' : '✎ Update Price'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Update Price Form - HR Head Only */}
      {isHRHead && showUpdateForm && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '2px solid #667eea',
        }}>
          <h3 style={{ marginTop: 0, color: '#667eea' }}>Update Gas Price</h3>
          <form onSubmit={handleUpdatePrice} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Price per Liter (₱) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                placeholder="e.g., 45.50"
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

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Effective Date *
              </label>
              <input
                type="date"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleInputChange}
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

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any notes about this price change..."
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

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Updating...' : '✓ Update Price'}
            </button>
          </form>
        </div>
      )}

      {/* Upcoming Prices */}
      {upcomingPrices.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>📅 Price Forecast (Next 3 Days)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {upcomingPrices.map((price, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#fff3e0',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #ffe0b2',
                }}
              >
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#999' }}>
                  {new Date(price.effectiveDate).toLocaleDateString()}
                </p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9800' }}>
                  ₱{price.price.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price History */}
      {priceHistory.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>📊 Recent Price Changes</h3>
          <div style={{
            overflowX: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Price</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Updated By</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.slice(0, 10).map((record, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: '600', color: '#4caf50' }}>
                      ₱{record.price.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {record.updatedBy?.firstName} {record.updatedBy?.lastName}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666' }}>
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingDashboard;
