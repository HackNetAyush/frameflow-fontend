import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth client.
 *
 * Dual transport, on purpose. Until the frontend and API share a root domain,
 * they sit on different hosts (Static Web Apps vs App Service) and a session
 * cookie would be third-party — which Safari/Brave drop. So the primary
 * mechanism is a bearer token: captured from the `set-auth-token` response
 * header after sign-in and replayed on every request. `credentials: 'include'`
 * is kept as well, so the moment both apps live under `*.explainme.xyz` the
 * cookie path starts working too, with no client change.
 */
const BEARER_KEY = 'xplainer.bearer';

const readToken = () => {
  try { return localStorage.getItem(BEARER_KEY) || ''; } catch { return ''; }
};
const writeToken = (token) => {
  try { localStorage.setItem(BEARER_KEY, token); } catch { /* storage blocked */ }
};
export const saveBearerToken = writeToken;
export const clearBearerToken = () => {
  try { localStorage.removeItem(BEARER_KEY); } catch { /* storage blocked */ }
};
export const getBearerToken = readToken;

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  fetchOptions: {
    credentials: 'include',
    auth: {
      type: 'Bearer',
      token: () => readToken(),
    },
    onSuccess: (ctx) => {
      // Better Auth returns a fresh session token on sign-in/sign-up and on
      // rotation; persist it so later requests (and reloads) stay signed in.
      const token = ctx.response.headers.get('set-auth-token');
      if (token) writeToken(token);
    },
  },
});

export const { useSession, signIn, signUp, updateUser, changePassword } = authClient;

/** Sign out everywhere: invalidate server-side, then drop the local token. */
export const signOut = async () => {
  try {
    await authClient.signOut();
  } finally {
    clearBearerToken();
  }
};
