import React, { useEffect, useRef, useState } from 'react';
import { getAuthConfig } from '../api';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    let script = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Google Sign-In could not be loaded')), { once: true });
  });
}

/**
 * "Continue with Google" using Google Identity Services. Renders nothing unless the server
 * has GOOGLE_CLIENT_ID configured. The ID token is verified by the server.
 */
export default function GoogleSignInButton({ onCredential, onError }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [clientId, setClientId] = useState(null);
  callbackRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    getAuthConfig()
      .then((cfg) => {
        if (!cancelled && cfg.googleEnabled && cfg.googleClientId) setClientId(cfg.googleClientId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current(response.credential)
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 300
        });
      })
      .catch((err) => onError?.(err.message));
    return () => {
      cancelled = true;
    };
  }, [clientId, onError]);

  if (!clientId) return null;

  return (
    <>
      <div className="auth-divider">
        <span>or continue with</span>
      </div>
      <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }} />
    </>
  );
}
