import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChevronLeft } from 'lucide-react';
import { register } from '../api';

const MIN_PASSWORD_LENGTH = 8;

export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMsg('Passwords do not match');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setMsg(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const res = await register(username.trim(), password, email.trim());
      setSuccess(true);
      setMsg(email.trim()
        ? '✨ Account created! We sent a verification link to your email.'
        : '✨ Account created successfully!');
      setTimeout(() => onLogin(res.token, res.user), 1200);
    } catch (error) {
      setMsg(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80" alt="" />
      </div>
      <form onSubmit={submit} className="auth-card">
        <button type="button" className="back-button" onClick={() => navigate('/')}>
          <ChevronLeft size={20} />
          Back
        </button>
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Start your learning adventure today</p>
        </div>

        {success && <div className="success-alert"><CheckCircle size={20} /> {msg}</div>}
        {!success && msg && <div className="error-alert">{msg}</div>}

        <div className="form-group">
          <label htmlFor="register-username">Username</label>
          <div className="input-wrapper">
            <input
              id="register-username"
              type="text"
              autoComplete="username"
              placeholder="Letters, numbers, . _ -"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_.\-]{3,30}"
              title="3-30 characters: letters, numbers, dots, dashes or underscores"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="register-email">Email (optional)</label>
          <div className="input-wrapper">
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="For notifications and account recovery"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="register-password">Password</label>
          <div className="input-wrapper">
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="register-confirm">Confirm Password</label>
          <div className="input-wrapper">
            <input
              id="register-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-button" disabled={loading || success}>
          {loading ? 'Creating account...' : 'Create Account'}
          {!loading && <ArrowRight size={20} />}
        </button>

        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>

        <p className="auth-switch">
          <button type="button" className="link-button-auth" onClick={() => navigate('/login')}>
            Sign in instead
          </button>
        </p>
      </form>
    </div>
  );
}
