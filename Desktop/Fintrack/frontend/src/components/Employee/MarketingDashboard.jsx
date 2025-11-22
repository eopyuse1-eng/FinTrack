import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GasPricingDashboard from '../Marketing/MarketingDashboard';
import '../Employee/styles/EmployeeDepartmentDashboard.css';

function MarketingDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [upcomingPrices, setUpcomingPrices] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Only marketing employees can access this
      if (userData.role !== 'employee' || userData.department !== 'marketing') {
        navigate('/');
        return;
      }
      setUser(userData);
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [token, navigate]);

  // Fetch gas pricing data
  useEffect(() => {
    const fetchGasPricingData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const [currentRes, upcomingRes] = await Promise.all([
          fetch('http://localhost:5000/api/gas-pricing/current', { headers }),
          fetch('http://localhost:5000/api/gas-pricing/upcoming', { headers }),
        ]);

        if (currentRes.ok) {
          const currentData = await currentRes.json();
          setCurrentPrice(currentData.data);
        }

        if (upcomingRes.ok) {
          const upcomingData = await upcomingRes.json();
          setUpcomingPrices(upcomingData.data || []);
        }
      } catch (error) {
        console.error('Error fetching gas pricing data:', error);
      }
    };

    if (token) {
      fetchGasPricingData();
      const interval = setInterval(fetchGasPricingData, 2 * 60 * 1000); // Refresh every 2 minutes
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <div className="employee-department-dashboard">
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div>
          {/* Gas Pricing Section */}
          <div style={{ marginBottom: '30px' }}>
            <GasPricingDashboard />
          </div>

          {/* Live Data Stats Section */}
          <div className="quick-stats-section">
            <h3>📊 Current Gas Pricing Data</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Current Price</h4>
                <p className="stat-value">
                  ₱{currentPrice?.price ? currentPrice.price.toFixed(2) : '0.00'}
                </p>
                <span className="stat-label">{currentPrice?.currency || 'PHP'}</span>
              </div>
              <div className="stat-card">
                <h4>Tomorrow's Price</h4>
                <p className="stat-value">
                  ₱{upcomingPrices[0]?.price ? upcomingPrices[0].price.toFixed(2) : '--'}
                </p>
                <span className="stat-label">Next Day</span>
              </div>
              <div className="stat-card">
                <h4>3-Day Average</h4>
                <p className="stat-value">
                  ₱{upcomingPrices.length > 0 
                    ? ((upcomingPrices.reduce((sum, p) => sum + p.price, currentPrice?.price || 0) / (upcomingPrices.length + 1)).toFixed(2))
                    : '--'
                  }
                </p>
                <span className="stat-label">Forecast</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingDashboard;
