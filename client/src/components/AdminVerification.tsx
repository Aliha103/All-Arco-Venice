import React, { useState } from 'react';
import './AdvancedPricingStyles.css';

interface AdminVerificationProps {
  onVerified: () => void;
  onCancel?: () => void;
}

export default function AdminVerification({ onVerified, onCancel }: AdminVerificationProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendSMS = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        setStep('code');
      } else {
        setError(data.message || 'Failed to send SMS');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, code })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onVerified();
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-overlay">
      <div className="verification-modal">
        <h2>Admin Verification Required</h2>
        
        {step === 'phone' && (
          <div className="verification-step">
            <p>Enter your phone number to receive a verification code:</p>
            
            <input
              type="tel"
              placeholder="Phone Number (+1234567890)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="verification-input"
            />
            
            <button
              onClick={sendSMS}
              disabled={loading || !phone.trim()}
              className="verification-btn"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
            
            <button
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  // Redirect to login to prevent unauthorized access
                  window.location.href = "/login";
                }
              }}
              className="verification-btn secondary"
            >
              Cancel
            </button>
          </div>
        )}
        
        {step === 'code' && (
          <div className="verification-step">
            <p>Enter the 6-digit code sent to {phone}:</p>
            
            <input
              type="text"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="verification-input code-input"
              maxLength={6}
            />
            
            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="verification-btn"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <button
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  // Redirect to login to prevent unauthorized access
                  window.location.href = "/login";
                }
              }}
              className="verification-btn secondary"
            >
              Cancel
            </button>
          </div>
        )}
        
        {error && <div className="verification-error">{error}</div>}
      </div>
    </div>
  );
}