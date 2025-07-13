import React, { useState, useEffect } from 'react';
import { QrCode, Shield, Smartphone, CheckCircle2, AlertTriangle, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';

interface FuturisticAuthenticatorProps {
  onSetupComplete: (secret: string) => void;
  onVerificationComplete: () => void;
  mode: 'setup' | 'verify';
  onCancel?: () => void;
}

export default function FuturisticAuthenticator({ 
  onSetupComplete, 
  onVerificationComplete, 
  mode,
  onCancel 
}: FuturisticAuthenticatorProps) {
  const [step, setStep] = useState<'instructions' | 'qr' | 'verify' | 'backup'>('instructions');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);

  // Animation states
  const [scanAnimation, setScanAnimation] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // TOTP timer for verification
  useEffect(() => {
    if (mode === 'verify' || step === 'verify') {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = 30 - (now % 30);
        setTimeRemaining(remaining);
        
        if (remaining === 30) {
          setPulseAnimation(true);
          setTimeout(() => setPulseAnimation(false), 1000);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [mode, step]);

  const generateTOTPSecret = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/auth/generate-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSecret(data.secret);
        setQrCode(data.qrCode);
        setBackupCodes(data.backupCodes || []);
        setStep('qr');
        setScanAnimation(true);
        setTimeout(() => setScanAnimation(false), 2000);
      } else {
        setError(data.message || 'Failed to generate authenticator setup');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (verificationCode.length !== 6) return;
    
    setLoading(true);
    setError('');
    
    try {
      const endpoint = mode === 'setup' 
        ? '/api/admin/auth/verify-totp-setup' 
        : '/api/admin/auth/verify-totp';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          code: verificationCode,
          secret: mode === 'setup' ? secret : undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (mode === 'setup') {
          setStep('backup');
        } else {
          onVerificationComplete();
        }
      } else {
        setError(data.message || 'Invalid verification code');
        setVerificationCode('');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const finishSetup = () => {
    onSetupComplete(secret);
  };

  if (mode === 'verify') {
    return (
      <div className="futuristic-auth-overlay">
        <div className="futuristic-auth-modal verify-mode">
          <div className="auth-header">
            <div className="security-icon-container">
              <div className={`security-shield ${pulseAnimation ? 'pulse' : ''}`}>
                <Shield className="security-icon" />
                <div className="shield-glow"></div>
              </div>
            </div>
            <h2 className="auth-title">Security Verification</h2>
            <p className="auth-subtitle">Enter your 6-digit authentication code</p>
          </div>

          <div className="verification-section">
            <div className="timer-display">
              <div className="timer-circle" style={{'--progress': `${(timeRemaining / 30) * 100}%`} as React.CSSProperties}>
                <span className="timer-text">{timeRemaining}s</span>
              </div>
              <p className="timer-label">Code refreshes in</p>
            </div>

            <div className="code-input-group">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="verification-code-input"
                maxLength={6}
                autoComplete="off"
              />
              <div className="input-glow"></div>
            </div>

            <button
              onClick={verifyTOTP}
              disabled={loading || verificationCode.length !== 6}
              className="futuristic-btn primary"
            >
              {loading ? (
                <><RefreshCw className="btn-icon spinning" /> Verifying...</>
              ) : (
                <><CheckCircle2 className="btn-icon" /> Verify Access</>
              )}
            </button>

            {onCancel && (
              <button onClick={onCancel} className="futuristic-btn secondary">
                Cancel
              </button>
            )}
          </div>

          {error && (
            <div className="error-message">
              <AlertTriangle className="error-icon" />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="futuristic-auth-overlay">
      <div className="futuristic-auth-modal">
        <div className="auth-header">
          <div className="security-icon-container">
            <div className="security-shield">
              <Smartphone className="security-icon" />
              <div className="shield-glow"></div>
            </div>
          </div>
          <h2 className="auth-title">Advanced Security Setup</h2>
          <p className="auth-subtitle">Configure Google Authenticator for ultimate protection</p>
        </div>

        {step === 'instructions' && (
          <div className="setup-step">
            <div className="instruction-grid">
              <div className="instruction-card">
                <div className="instruction-number">1</div>
                <h3>Install App</h3>
                <p>Download Google Authenticator or Authy on your mobile device</p>
              </div>
              <div className="instruction-card">
                <div className="instruction-number">2</div>
                <h3>Scan QR Code</h3>
                <p>Use the app to scan the QR code we'll generate for you</p>
              </div>
              <div className="instruction-card">
                <div className="instruction-number">3</div>
                <h3>Verify Setup</h3>
                <p>Enter the 6-digit code from your app to complete setup</p>
              </div>
            </div>

            <button
              onClick={generateTOTPSecret}
              disabled={loading}
              className="futuristic-btn primary"
            >
              {loading ? (
                <><RefreshCw className="btn-icon spinning" /> Generating...</>
              ) : (
                <><QrCode className="btn-icon" /> Generate QR Code</>
              )}
            </button>
          </div>
        )}

        {step === 'qr' && (
          <div className="setup-step">
            <div className="qr-section">
              <div className={`qr-container ${scanAnimation ? 'scanning' : ''}`}>
                {qrCode && (
                  <img src={qrCode} alt="QR Code" className="qr-code" />
                )}
                <div className="qr-scanner-line"></div>
              </div>
              
              <div className="secret-backup">
                <label className="secret-label">Manual Entry Key:</label>
                <div className="secret-display">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={secret}
                    readOnly
                    className="secret-input"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="secret-toggle"
                  >
                    {showSecret ? <EyeOff /> : <Eye />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(secret)}
                    className="secret-copy"
                  >
                    <Copy />
                  </button>
                </div>
                <p className="secret-note">
                  Save this key securely. You can use it to set up authenticator manually.
                </p>
              </div>
            </div>

            <div className="verification-section">
              <h3>Verify Your Setup</h3>
              <p>Enter the 6-digit code from your authenticator app:</p>
              
              <div className="code-input-group">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="verification-code-input"
                  maxLength={6}
                  autoComplete="off"
                />
                <div className="input-glow"></div>
              </div>

              <button
                onClick={verifyTOTP}
                disabled={loading || verificationCode.length !== 6}
                className="futuristic-btn primary"
              >
                {loading ? (
                  <><RefreshCw className="btn-icon spinning" /> Verifying...</>
                ) : (
                  <><CheckCircle2 className="btn-icon" /> Verify & Continue</>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="setup-step">
            <div className="backup-section">
              <h3>Backup Recovery Codes</h3>
              <p>Save these codes in a secure location. You can use them to access your account if you lose your authenticator device.</p>
              
              <div className="backup-codes-grid">
                {backupCodes.map((code, index) => (
                  <div key={index} className="backup-code">
                    <span className="code-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="code-value">{code}</span>
                  </div>
                ))}
              </div>

              <div className="backup-actions">
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="futuristic-btn secondary"
                >
                  <Copy className="btn-icon" /> Copy All Codes
                </button>
                
                <button
                  onClick={finishSetup}
                  className="futuristic-btn primary"
                >
                  <CheckCircle2 className="btn-icon" /> Complete Setup
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <AlertTriangle className="error-icon" />
            {error}
          </div>
        )}

        {onCancel && (
          <button onClick={onCancel} className="cancel-btn">
            Cancel Setup
          </button>
        )}
      </div>
    </div>
  );
}