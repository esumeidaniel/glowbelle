import { Eye, EyeOff, User, Lock, Phone, Mail, KeyRound, BadgeCheck, BriefcaseBusiness, CalendarCheck, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { glowbelleApi, setToken } from '../api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google);

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function LoginPage({ setPage, setUser }) {
  const [mode, setMode] = useState('login'); // login | register | verify | forgot | reset
  const [audience, setAudience] = useState('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);

  const completeLogin = useCallback((response) => {
    if (audience === 'business' && response.data.role === 'customer') {
      setToken(null);
      setError('This is a customer account. Use Customer login, or apply as a professional business user.');
      return;
    }
    setToken(response.token);
    setUser(response.data);
    setPage(response.data.role === 'admin' ? 'admin' : response.data.role === 'stylist' ? 'stylist' : 'home');
  }, [audience, setPage, setUser]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setMessage('');
    setCode('');
    setConfirmPassword('');
  }

  useEffect(() => {
    let cancelled = false;

    async function setupGoogleLogin() {
      if (!GOOGLE_CLIENT_ID || !googleBtnRef.current || mode === 'forgot' || mode === 'reset' || mode === 'verify') return;

      try {
        await loadGoogleScript();
        if (cancelled) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async ({ credential }) => {
            setError('');
            setMessage('');
            setLoading(true);
            try {
              const response = await glowbelleApi.googleLogin(credential);
              completeLogin(response);
            } catch (err) {
              setError(err.message || 'Google login failed');
            } finally {
              setLoading(false);
            }
          },
        });

        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: mode === 'register' ? 'signup_with' : 'signin_with',
        });
        setGoogleReady(true);
      } catch {
        if (!cancelled) setError('Google login could not load. Please try email login or refresh the page.');
      }
    }

    setupGoogleLogin();
    return () => { cancelled = true; };
  }, [completeLogin, mode]);

  async function submit() {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name || !email || !password) throw new Error('Please fill in your name, email and password.');
        const response = await glowbelleApi.register({ name, email, phone, password });
        setMessage(response.message || 'Verification code sent to your email.');
        setMode('verify');
        return;
      }

      if (mode === 'verify') {
        if (!email || !code) throw new Error('Enter your email and verification code.');
        const response = await glowbelleApi.verifyEmail({ email, code });
        completeLogin(response);
        return;
      }

      if (mode === 'forgot') {
        if (!email) throw new Error('Enter your email address.');
        const response = await glowbelleApi.forgotPassword(email);
        setMessage(response.message || 'If that email exists, a reset code has been sent.');
        setMode('reset');
        return;
      }

      if (mode === 'reset') {
        if (!email || !code || !password) throw new Error('Enter your email, reset code and new password.');
        if (password.length < 6) throw new Error('New password must be at least 6 characters.');
        if (password !== confirmPassword) throw new Error('New passwords do not match.');
        const response = await glowbelleApi.resetPassword({ email, code, password });
        completeLogin(response);
        return;
      }

      if (!email || !password) throw new Error('Please enter your email and password.');
      const response = await glowbelleApi.login({ email, password });
      completeLogin(response);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      if (mode === 'login' && String(err.message || '').toLowerCase().includes('verify')) {
        setMode('verify');
        setMessage('Enter the verification code sent to your email.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setError('');
    setMessage('');
    if (!email) { setError('Enter your email first.'); return; }

    setLoading(true);
    try {
      const response = await glowbelleApi.resendVerification(email);
      setMessage(response.message || 'A new verification code has been sent.');
    } catch (err) {
      setError(err.message || 'Could not resend code');
    } finally {
      setLoading(false);
    }
  }

  const title = {
    login: audience === 'business' ? 'Professional sign in' : 'Welcome back',
    register: 'Create customer account',
    verify: 'Verify your email',
    forgot: 'Reset password',
    reset: 'Enter reset code',
  }[mode];

  const subtitle = {
    login: audience === 'business' ? 'Access your stylist dashboard, bookings, services, portfolio and discounts.' : 'Log in to book services and manage your profile.',
    register: 'Customer accounts are for booking services. Professionals apply separately for verification.',
    verify: 'Enter the 6-digit code sent to your email address.',
    forgot: 'Enter your email and we will send a reset code.',
    reset: 'Enter the code from your email and choose a new password.',
  }[mode];

  return (
    <div className="login-page">
      <section className="auth-showcase">
        <span className="pill"><BadgeCheck size={16} /> Role-aware beauty marketplace</span>
        <h1>One website. Three clean experiences.</h1>
        <p>Customers book services, approved professionals manage their business, and GlowBelle keeps the marketplace trusted without mixing dashboards.</p>
        <div className="auth-benefits">
          <div><CalendarCheck size={18} /><span>Customers book verified stylists directly</span></div>
          <div><BriefcaseBusiness size={18} /><span>Professionals manage bookings, prices and portfolios</span></div>
          <div><ShieldCheck size={18} /><span>Real businesses are approved before they go live</span></div>
        </div>
      </section>
      <div className="login-card">
        <div className="login-logo"><span className="logo">GB</span><span>GlowBelle</span></div>

        <div className="audience-switch">
          <button className={audience === 'customer' ? 'active' : ''} onClick={() => setAudience('customer')} type="button">
            <strong>Customer</strong><span>Book services</span>
          </button>
          <button className={audience === 'business' ? 'active' : ''} onClick={() => setAudience('business')} type="button">
            <strong>Professional</strong><span>Run your business</span>
          </button>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Log In</button>
          {audience === 'customer'
            ? <button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Register</button>
            : <button onClick={() => setPage('stylist-apply')} type="button">Apply as professional</button>}
        </div>

        <h2 style={{ marginTop: 18 }}>{title}</h2>
        <p style={{ color: 'var(--text)', marginBottom: 20 }}>{subtitle}</p>

        <div className="login-form">
          {mode === 'register' && (
            <div className="input-wrap">
              <User size={16} />
              <input placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          {mode === 'register' && (
            <div className="input-wrap">
              <Phone size={16} />
              <input placeholder="Phone number, e.g. 08012345678" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          )}

          <div className="input-wrap">
            <Mail size={16} />
            <input type="email" placeholder={audience === 'business' ? 'Professional email address' : 'Email address'} value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {(mode === 'verify' || mode === 'reset') && (
            <div className="input-wrap">
              <KeyRound size={16} />
              <input inputMode="numeric" maxLength={6} placeholder="Enter the 6-digit email code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
          )}

          {mode !== 'forgot' && mode !== 'verify' && (
            <div className="input-wrap">
              <Lock size={16} />
              <input type={showPw ? 'text' : 'password'} placeholder={mode === 'reset' ? 'Create a new password' : 'Enter your password'} value={password} onChange={e => setPassword(e.target.value)} />
              <button className="pw-toggle" type="button" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          )}

          {mode === 'reset' && (
            <div className="input-wrap">
              <Lock size={16} />
              <input type={showPw ? 'text' : 'password'} placeholder="Re-enter your new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          )}

          {message && <div className="promo-success">{message}</div>}
          {error && <div className="promo-error">{error}</div>}

          <button className="login-submit" onClick={submit} disabled={loading}>
            {loading ? '⏳ Please wait…' : mode === 'login' ? 'Log In' : mode === 'register' ? 'Create Account' : mode === 'verify' ? 'Verify Account' : mode === 'forgot' ? 'Send Reset Code' : 'Reset Password'}
          </button>

          {mode === 'verify' && (
            <button className="text-btn" type="button" onClick={resendCode} disabled={loading}>Resend verification code</button>
          )}

          {mode === 'login' && (
            <button className="text-btn" type="button" onClick={() => switchMode('forgot')}>Forgot password?</button>
          )}
          {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
            <button className="text-btn" type="button" onClick={() => switchMode('login')}>← Back to login</button>
          )}
        </div>

        {(mode === 'login' || mode === 'register') && (
          <>
            <div className="social-divider"><span>or continue with</span></div>
            {GOOGLE_CLIENT_ID ? (
              <div className="google-login-wrap">
                <div ref={googleBtnRef} />
                {!googleReady && <button className="social-btn" disabled>Loading Google…</button>}
              </div>
            ) : (
              <button className="social-btn" disabled title="Add VITE_GOOGLE_CLIENT_ID to enable Google login">Google login not configured</button>
            )}
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text)', marginTop: 20 }}>
          By continuing, you agree to GlowBelle's <button className="inline-link" type="button" onClick={() => setPage('terms')}>Terms</button> and <button className="inline-link" type="button" onClick={() => setPage('privacy')}>Privacy Policy</button>.
        </p>
        {audience === 'business' && <div className="business-auth-note">
          <strong>New professional?</strong>
          <span>Apply with your ID, business address and workspace evidence. Approval is required before customers can book you.</span>
          <button className="text-btn" type="button" onClick={() => setPage('stylist-apply')}>Start professional application</button>
        </div>}
      </div>
    </div>
  );
}
