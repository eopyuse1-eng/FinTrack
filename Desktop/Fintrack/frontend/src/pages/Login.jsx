import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/Login.css';

// API base URL - Use Vite environment variable or default to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('🌐 API_BASE_URL:', API_BASE_URL);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLocalLogin, setShowLocalLogin] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(null);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [isSubmittingUnlock, setIsSubmittingUnlock] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const debounceTimer = useRef(null);

  // Check if there's a token from OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Decode token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('user', JSON.stringify(payload));
        navigate('/dashboard');
      } catch (err) {
        console.error('Error decoding token:', err);
        setError('OAuth login successful but failed to process token');
      }
    }
  }, [searchParams, navigate]);

  // Debounced email verification check
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setError(''); // Clear error when typing

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only check after user stops typing for 500ms
    if (newEmail.includes('@')) {
      debounceTimer.current = setTimeout(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/check-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail }),
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            setIsEmailVerified(data.isEmailVerified);
          }
        } catch (err) {
          console.error('Error checking verification:', err);
        }
      }, 500); // Wait 500ms after user stops typing
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleUnlockRequest = async () => {
    if (!unlockReason.trim()) {
      alert('Please provide a reason for your unlock request');
      return;
    }

    setIsSubmittingUnlock(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, reason: unlockReason }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✓ Unlock request submitted successfully. The HR Head will review your request shortly.');
        setShowUnlockModal(false);
        setUnlockReason('');
        setIsAccountLocked(false);
      } else {
        alert(`Error: ${data.message || 'Failed to submit unlock request'}`);
      }
    } catch (err) {
      console.error('Unlock request error:', err);
      alert(`Error: ${err.message || 'Failed to submit unlock request'}`);
    } finally {
      setIsSubmittingUnlock(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`🔐 Login attempt: ${email}`);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log(`✓ Response received: ${response.status}`);
      const data = await response.json();
      console.log(`✓ Data parsed:`, data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Navigate immediately to dashboard
        navigate('/dashboard');
      } else {
        // Handle different error types
        if (data.code === 'ACCOUNT_LOCKED') {
          setError('Your account has been locked due to too many failed login attempts.');
          setIsAccountLocked(true);
          setLockUntil(data.lockUntil);
          setShowUnlockModal(true);
        } else if (data.code === 'EMAIL_NOT_VERIFIED') {
          setError('Email not verified. Please use "Sign in with Google" first.');
          setShowLocalLogin(false);
          setIsEmailVerified(false);
        } else if (data.code === 'ACCOUNT_DISABLED') {
          setError(data.message || 'This account has been disabled.');
        } else {
          setError(data.message || 'Invalid email or password');
        }
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(`Error: ${err.message || 'Connection failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-box">
          <div className="login-header">
            <h1>FinTrack</h1>
            <p>Human Resource Information System</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* OAuth Login Section */}
          {!showLocalLogin && (
            <div className="oauth-section">
              <h2>Sign In</h2>
              
              <button
                type="button"
                className="google-login-btn"
                onClick={handleGoogleLogin}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,1.25,12.545,1.25 c-6.343,0-11.5,5.157-11.5,11.5c0,6.343,5.157,11.5,11.5,11.5c6.343,0,11.5-5.157,11.5-11.5c0-0.828-0.084-1.628-0.241-2.388 H12.545Z"/>
                </svg>
                Sign in with Google
              </button>

              <div className="divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="email-login-btn"
                onClick={() => setShowLocalLogin(true)}
              >
                Sign in with Email
              </button>

              <p className="login-note">
                💡 New users must verify their Gmail first before using email/password login
              </p>
            </div>
          )}

          {/* Email/Password Login Section */}
          {showLocalLogin && (
            <form onSubmit={handleSubmit} className="login-form">
              <h2>Email & Password Login</h2>

              {isEmailVerified === false && (
                <div className="warning-message">
                  ⚠️ This email hasn't been verified yet. Please use "Sign in with Google" to verify first.
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your.email@company.com"
                  required
                  disabled={isLoading}
                />
                {isEmailVerified !== null && (
                  <small className={isEmailVerified ? 'success' : 'warning'}>
                    {isEmailVerified ? '✓ Email verified' : '⚠ Email not verified - use Google OAuth first'}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={isLoading || isEmailVerified === false}
              >
                {isLoading && <span className="loading-spinner"></span>}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                className="back-btn"
                onClick={() => {
                  setShowLocalLogin(false);
                  setError('');
                }}
                disabled={isLoading}
              >
                ← Back to OAuth
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Account Locked Modal */}
      {showUnlockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>🔒 Account Locked</h2>
            <p>Your account has been locked due to too many failed login attempts.</p>
            
            <div className="unlock-info">
              <p><strong>Lock until:</strong> {new Date(lockUntil).toLocaleString()}</p>
              <p>To unlock your account, please provide a reason for the unlock request. The HR Head will review and approve or deny your request.</p>
            </div>

            <div className="form-group">
              <label htmlFor="unlock-reason">Reason for Unlock Request:</label>
              <textarea
                id="unlock-reason"
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Please explain why you need to unlock your account..."
                rows="4"
                maxLength="500"
                disabled={isSubmittingUnlock}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                }}
              />
              <small>{unlockReason.length}/500 characters</small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleUnlockRequest}
                disabled={isSubmittingUnlock}
              >
                {isSubmittingUnlock ? 'Submitting...' : 'Submit Unlock Request'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockReason('');
                }}
                disabled={isSubmittingUnlock}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
