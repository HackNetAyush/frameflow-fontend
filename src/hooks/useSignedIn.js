import { useAuth } from '@clerk/clerk-react';

/**
 * Session state as a boolean, treating "not resolved yet" as signed out.
 *
 * `<SignedIn>` and `<SignedOut>` both render nothing until Clerk has loaded,
 * which on the marketing page means the hero appears with no call to action
 * for as long as that takes. A visitor is signed out far more often than not,
 * so defaulting to that and swapping once the session resolves is the better
 * guess — and it degrades to a working page if Clerk never loads at all.
 */
export const useSignedIn = () => {
  const { isLoaded, isSignedIn } = useAuth();
  return Boolean(isLoaded && isSignedIn);
};
