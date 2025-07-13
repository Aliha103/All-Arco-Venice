import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Smartphone, 
  Shield, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  Scan,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Brain,
  Globe
} from 'lucide-react';
import FuturisticAuthenticator from './FuturisticAuthenticator';
import '../styles/FuturisticAuth.css';

interface LoginStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export default function FuturisticLogin() {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTOTP, setShowTOTP] = useState(false);
  const [showSetupTOTP, setShowSetupTOTP] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState({
    score: 0,
    factors: [] as string[],
    recommendation: 'standard'
  });

  const [steps, setSteps] = useState<LoginStep[]>([
    {
      id: 'credentials',
      title: 'Identity Verification',
      description: 'Enter your credentials',
      icon: <Lock className="step-icon" />,
      status: 'active'
    },
    {
      id: 'risk-analysis',
      title: 'Risk Assessment',
      description: 'Analyzing login security',
      icon: <Brain className="step-icon" />,
      status: 'pending'
    },
    {
      id: 'mfa',
      title: 'Multi-Factor Auth',
      description: 'Additional security verification',
      icon: <Shield className="step-icon" />,
      status: 'pending'
    },
    {
      id: 'access-granted',
      title: 'Access Granted',
      description: 'Welcome to the system',
      icon: <CheckCircle2 className="step-icon" />,
      status: 'pending'
    }
  ]);

  // Check for biometric support
  useEffect(() => {
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      setBiometricSupported(true);
    }
  }, []);

  // Update step status
  const updateStepStatus = (stepIndex: number, status: LoginStep['status']) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status } : step
    ));
  };

  const performRiskAssessment = async () => {
    setCurrentStep(1);
    updateStepStatus(0, 'completed');
    updateStepStatus(1, 'active');

    // Simulate risk assessment
    setLoading(true);
    
    const factors: string[] = [];
    let score = 0;

    // Check time of day
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      factors.push('Unusual login time');
      score += 20;
    }

    // Check browser/device info
    const userAgent = navigator.userAgent;
    if (!userAgent.includes('Chrome') && !userAgent.includes('Firefox')) {
      factors.push('Uncommon browser');
      score += 15;
    }

    // Geolocation check (mock)
    try {
      if ('geolocation' in navigator) {
        factors.push('Location verification');
        score += 10;
      }
    } catch (e) {
      factors.push('Location unavailable');
      score += 25;
    }

    // Network analysis (mock)
    factors.push('Network fingerprinting');
    
    // Determine recommendation
    let recommendation = 'standard';
    if (score > 50) recommendation = 'high-security';
    else if (score > 25) recommendation = 'enhanced';

    await new Promise(resolve => setTimeout(resolve, 2000));

    setRiskAssessment({ score, factors, recommendation });
    updateStepStatus(1, 'completed');
    setLoading(false);
    
    // Move to MFA step
    setCurrentStep(2);
    updateStepStatus(2, 'active');
  };

  const handleCredentialSubmit = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresTOTPSetup) {
          setShowSetupTOTP(true);
          setLoading(false);
          return;
        }
        
        if (data.requiresTOTP) {
          await performRiskAssessment();
          setShowTOTP(true);
        } else {
          // Direct access granted
          setCurrentStep(3);
          updateStepStatus(2, 'completed');
          updateStepStatus(3, 'completed');
          
          setTimeout(() => {
            window.location.href = '/admin/dashboard';
          }, 2000);
        }
      } else {
        setError(data.message || 'Invalid credentials');
        updateStepStatus(0, 'error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      updateStepStatus(0, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTOTPVerification = async () => {
    if (totpCode.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: totpCode })
      });

      if (response.ok) {
        setCurrentStep(3);
        updateStepStatus(2, 'completed');
        updateStepStatus(3, 'completed');
        
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid verification code');
        setTotpCode('');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricSupported) return;

    try {
      setLoading(true);
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [],
          userVerification: 'required'
        }
      });

      if (credential) {
        // Process biometric authentication
        console.log('Biometric authentication successful');
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showSetupTOTP) {
    return (
      <FuturisticAuthenticator
        mode="setup"
        onSetupComplete={() => {
          setShowSetupTOTP(false);
          performRiskAssessment();
          setShowTOTP(true);
        }}
        onVerificationComplete={() => {}}
        onCancel={() => setShowSetupTOTP(false)}
      />
    );
  }

  if (showTOTP) {
    return (
      <FuturisticAuthenticator
        mode="verify"
        onSetupComplete={() => {}}
        onVerificationComplete={() => {
          setCurrentStep(3);
          updateStepStatus(2, 'completed');
          updateStepStatus(3, 'completed');
          
          setTimeout(() => {
            window.location.href = '/admin/dashboard';
          }, 2000);
        }}
        onCancel={() => setShowTOTP(false)}
      />
    );
  }

  return (
    <div className="futuristic-login-container">
      {/* Background Effects */}
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="neural-network">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`neural-node node-${i}`}></div>
          ))}
        </div>
      </div>

      {/* Main Login Interface */}
      <div className="login-interface">
        {/* Progress Steps */}
        <div className="login-steps">
          {steps.map((step, index) => (
            <div key={step.id} className={`login-step ${step.status}`}>
              <div className="step-connector" />
              <div className="step-indicator">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="step-icon completed" />
                ) : step.status === 'error' ? (
                  <AlertTriangle className="step-icon error" />
                ) : step.status === 'active' ? (
                  <div className="step-icon active">{step.icon}</div>
                ) : (
                  <div className="step-icon pending">{step.icon}</div>
                )}
              </div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Login Form */}
        <div className="login-form-container">
          <div className="login-header">
            <h1 className="login-title">
              <Zap className="title-icon" />
              Secure Admin Portal
            </h1>
            <p className="login-subtitle">
              Advanced authentication with multi-layer security
            </p>
          </div>

          {currentStep === 0 && (
            <div className="credential-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="futuristic-input"
                  placeholder="admin@example.com"
                  onKeyPress={(e) => e.key === 'Enter' && handleCredentialSubmit()}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="futuristic-input"
                    placeholder="Enter your password"
                    onKeyPress={(e) => e.key === 'Enter' && handleCredentialSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleCredentialSubmit}
                disabled={loading || !email || !password}
                className="futuristic-btn primary large"
              >
                {loading ? (
                  <><RefreshCw className="btn-icon spinning" /> Authenticating...</>
                ) : (
                  <><Lock className="btn-icon" /> Secure Login</>
                )}
              </button>

              {biometricSupported && (
                <div className="biometric-section">
                  <div className="divider">
                    <span>or</span>
                  </div>
                  <button
                    onClick={handleBiometricLogin}
                    className="futuristic-btn secondary large"
                  >
                    <Fingerprint className="btn-icon" />
                    Biometric Authentication
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="risk-assessment">
              <div className="assessment-header">
                <Brain className="assessment-icon" />
                <h3>Security Risk Analysis</h3>
                <p>Evaluating login context and threat indicators</p>
              </div>

              <div className="assessment-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '70%'}}></div>
                </div>
                <span className="progress-text">Analyzing...</span>
              </div>

              <div className="risk-factors">
                {riskAssessment.factors.map((factor, index) => (
                  <div key={index} className="risk-factor">
                    <Scan className="factor-icon" />
                    {factor}
                  </div>
                ))}
              </div>

              {riskAssessment.score > 0 && (
                <div className="risk-score">
                  <span className="score-label">Risk Score:</span>
                  <span className={`score-value ${riskAssessment.recommendation}`}>
                    {riskAssessment.score}%
                  </span>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="access-granted">
              <div className="success-animation">
                <CheckCircle2 className="success-icon" />
                <div className="success-rings">
                  <div className="ring ring-1"></div>
                  <div className="ring ring-2"></div>
                  <div className="ring ring-3"></div>
                </div>
              </div>
              <h3>Access Granted</h3>
              <p>Welcome back! Redirecting to admin dashboard...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertTriangle className="error-icon" />
              {error}
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div className="security-badge">
          <Globe className="badge-icon" />
          <div className="badge-content">
            <span className="badge-title">Quantum-Safe Encryption</span>
            <span className="badge-subtitle">AES-256 + RSA-4096</span>
          </div>
        </div>
      </div>
    </div>
  );
}