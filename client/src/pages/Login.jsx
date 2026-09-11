import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { login, loginWithGoogle } from '../api';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const finishLogin = (res) => {
    onLogin(res.token, res.user);
    navigate('/dashboard');
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      finishLogin(await login(username, password));
    } catch (error) {
      setErr(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setLoading(true);
    setErr(null);
    try {
      finishLogin(await loginWithGoogle(credential));
    } catch (error) {
      setErr(error.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = useCallback((message) => setErr(message), []);

  return (
    <div className="auth-container">
      <div className="auth-background">
        <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80" alt="" />
      </div>
      <form onSubmit={submit} className="auth-card">
        <button type="button" className="back-button" onClick={() => navigate('/')}>
          <ChevronLeft size={20} />
          Back
        </button>
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your learning journey</p>
        </div>

        {err && <div className="error-alert">{err}</div>}

        <div className="form-group">
          <label htmlFor="login-username">Email or Username</label>
          <div className="input-wrapper">
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <div className="input-wrapper">
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
          {!loading && <ArrowRight size={20} />}
        </button>

        <GoogleSignInButton onCredential={handleGoogleCredential} onError={handleGoogleError} />

        <div className="auth-divider">
          <span>New to Adaptive English?</span>
        </div>

        <p className="auth-switch">
          <button type="button" className="link-button-auth" onClick={() => navigate('/register')}>
            Create an account
          </button>
        </p>
      </form>
    </div>
  );
}
