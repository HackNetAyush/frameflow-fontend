import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';

import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import SetupNotice from './pages/SetupNotice';
import NotFound from './pages/NotFound';
import RequireAuth from './components/Auth/RequireAuth';
import LoadingScreen from './components/Layout/LoadingScreen';

/*
 * The studio pulls in the whole render engine — muxer, encoder, layout — and
 * the docs page pulls in its own visuals. Neither is needed by someone who
 * just opened the landing page, so both are split out of the first load.
 */
const Studio = lazy(() => import('./pages/Studio'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));

import { useThemeMode } from './theme/context';
import { clerkAppearance } from './lib/clerkAppearance';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * A client-side route change should start at the top of the new page, but an
 * in-page anchor (`/#pipeline`) must be left alone or the browser's own hash
 * scroll is undone a frame later.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<Landing />} />
    <Route path="/how-it-works" element={<HowItWorks />} />

    {/*
     * Clerk owns every sub-path under these two (verification, factor-two,
     * SSO callbacks), so the routes have to be splats.
     */}
    <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
    <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />

    {/*
     * Protected. One Studio element serves /app and /app/videos so a render in
     * flight is not unmounted when the user switches tabs.
     */}
    <Route
      path="/app/*"
      element={
        <RequireAuth>
          <Studio />
        </RequireAuth>
      }
    />

    <Route path="/studio" element={<Navigate to="/app" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

/** Clerk is configured here because its theme has to follow ours. */
const ClerkGate = () => {
  const { theme } = useThemeMode();
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={clerkAppearance(theme)}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      // Hand navigation to the router so Clerk's multi-step flows do not
      // trigger full page loads.
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <Suspense fallback={<LoadingScreen message="Loading…" caption="Xplainer" />}>
        <AppRoutes />
      </Suspense>
    </ClerkProvider>
  );
};

const App = () => (
  <>
    <ScrollToTop />
    {PUBLISHABLE_KEY ? (
      <ClerkGate />
    ) : (
      /*
       * Without a key every Clerk component would throw, so the app degrades
       * to an explainer of what is missing. The docs page needs no session, so
       * it stays reachable.
       */
      <Suspense fallback={<LoadingScreen message="Loading…" caption="Xplainer" />}>
        <Routes>
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="*" element={<SetupNotice />} />
        </Routes>
      </Suspense>
    )}
  </>
);

export default App;
