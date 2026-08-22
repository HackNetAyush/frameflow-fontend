import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import LoadingScreen from '../Layout/LoadingScreen';

/**
 * Route guard.
 *
 * Clerk resolves the session asynchronously, so the loading branch matters:
 * rendering the redirect before `isLoaded` would bounce every signed-in user
 * back to the sign-in page on a hard refresh.
 */
const RequireAuth = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <LoadingScreen message="Checking your session…" caption="Clerk · Secure sign-in" />;
  }

  if (!isSignedIn) {
    // Clerk honours `redirect_url` over the widget's fallback, so the user
    // lands back on the page they actually asked for.
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={`/sign-in?redirect_url=${encodeURIComponent(target)}`} replace />;
  }

  return children;
};

export default RequireAuth;
