import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
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
const Account = lazy(() => import('./pages/Account'));
const AuthComplete = lazy(() => import('./pages/AuthComplete'));

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

const App = () => (
  <>
    <ScrollToTop />
    <Suspense fallback={<LoadingScreen message="Loading…" caption="Xplainer" />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="/sign-up" element={<AuthPage mode="sign-up" />} />
        <Route path="/auth/complete" element={<AuthComplete />} />

        {/*
         * Protected. One Studio element serves /app and /app/videos so a render
         * in flight is not unmounted when the user switches tabs. /app/account
         * is more specific, so it wins over the splat in React Router's ranking.
         */}
        <Route
          path="/app/account"
          element={
            <RequireAuth>
              <Account />
            </RequireAuth>
          }
        />
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
    </Suspense>
  </>
);

export default App;
