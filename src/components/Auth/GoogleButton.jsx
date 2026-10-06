import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { signIn } from '../../lib/authClient';

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
  </svg>
);

/**
 * Starts a Google OAuth flow. This is a full-page redirect, so `callbackURL`
 * must be an absolute URL back to this frontend — the backend sends the browser
 * there once Google returns.
 */
const GoogleButton = ({ redirect = '/app', setError }) => {
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (busy) return;
    setError?.('');
    setBusy(true);
    try {
      const callback = new URL('/api/oauth/bridge', import.meta.env.VITE_SERVER_URL);
      callback.searchParams.set('redirect', redirect);
      const callbackURL = callback.toString();
      const res = await signIn.social({ provider: 'google', callbackURL });
      // On success the call returns a redirect URL / navigates; only reach here
      // on an error or if the provider isn't configured.
      if (res?.error) {
        setError?.(res.error.message || 'Google sign-in is unavailable right now.');
        setBusy(false);
      }
    } catch {
      setError?.('Could not start Google sign-in. Please try again.');
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={start}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-ink-900 px-4 py-2.5 text-[13.5px] font-semibold text-mist-100 transition-colors hover:bg-ink-850 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-[18px] w-[18px]" />}
      Continue with Google
    </button>
  );
};

export default GoogleButton;
