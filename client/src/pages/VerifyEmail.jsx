import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState({ status: 'loading', message: 'Verifying your email address...' });

  useEffect(() => {
    // The token is single-use; avoid a second request from React StrictMode's double effect
    if (started.current) return;
    started.current = true;

    const token = params.get('token');
    if (!token) {
      setState({ status: 'error', message: 'This verification link is missing its token.' });
      return;
    }
    verifyEmail(token)
      .then((result) => setState({ status: 'success', message: result.message || 'Your email address has been verified.' }))
      .catch((error) => setState({
        status: 'error',
        message: error.response?.data?.error || 'Verification failed. The link may have expired.'
      }));
  }, [params]);

  const alertClass = state.status === 'error' ? 'error-alert' : state.status === 'success' ? 'success-alert' : '';

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <h2>Email Verification</h2>
        </div>
        <div className={alertClass}>{state.message}</div>
        {state.status !== 'loading' && (
          <button type="button" className="auth-button" onClick={() => navigate('/dashboard')}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
