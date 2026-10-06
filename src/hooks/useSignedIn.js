import { useSession } from '../lib/authClient';

/**
 * Session state as a boolean, treating "not resolved yet" as signed out.
 *
 * On the marketing page the session is still resolving for the first moment,
 * and a visitor is signed out far more often than not, so defaulting to that
 * and swapping once it resolves is the better guess — and it degrades to a
 * working page if the auth server never answers.
 */
export const useSignedIn = () => {
  const { data, isPending } = useSession();
  return Boolean(!isPending && data?.user);
};
