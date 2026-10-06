import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../lib/authClient';

import LoadingScreen from '../Layout/LoadingScreen';

/**
 * Route guard.
 *
 * The session resolves asynchronously, so the loading branch matters: rendering
 * the redirect before it resolves would bounce every signed-in user back to the
 * sign-in page on a hard refresh.
 */
const RequireAuth = ({ children }) => {
  const { data, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return <LoadingScreen message="Checking your session…" caption="Secure sign-in" />;
  }

  if (!data?.user) {
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={`/sign-in?redirect=${encodeURIComponent(target)}`} replace />;
  }

  return children;
};

export default RequireAuth;
