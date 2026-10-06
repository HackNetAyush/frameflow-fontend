import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { saveBearerToken } from '../lib/authClient';
import LoadingScreen from '../components/Layout/LoadingScreen';

const AuthComplete = () => {
  const [params] = useSearchParams();
  const [error, setError] = useState(params.get('error') || '');
  const started = useRef(false);
  const code = params.get('code');

  useEffect(() => {
    if (started.current || !code || error) return;
    started.current = true;
    (async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/oauth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const result = await response.json();
        if (!response.ok || !result.token) throw new Error(result.error || 'Google sign-in failed.');
        saveBearerToken(result.token);
        window.location.replace(result.redirect || '/app');
      } catch (cause) {
        setError(cause.message || 'Google sign-in failed. Please try again.');
      }
    })();
  }, [code, error]);

  if (!error && code) return <LoadingScreen message="Finishing Google sign-in…" caption="Xplainer" />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center text-mist-100">
      <h1 className="text-xl font-bold">Could not complete sign-in</h1>
      <p className="max-w-md text-sm text-mist-400">{error || 'The sign-in link is missing.'}</p>
      <Link to="/sign-in" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent">
        Try again
      </Link>
    </main>
  );
};

export default AuthComplete;
