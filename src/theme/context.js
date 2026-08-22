import { createContext, useContext } from 'react';

/*
 * The theme has to be readable one level above the app: Clerk's components are
 * styled through a JS `appearance` object rather than CSS, so `ClerkProvider`
 * needs to know which palette is active. Context keeps the header toggle and
 * Clerk's own DOM in sync.
 *
 * Context and hook live in this plain module — separate from the provider
 * component — so the provider's file only exports components and React Fast
 * Refresh keeps working.
 */
export const ThemeContext = createContext(null);

export const useThemeMode = () => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useThemeMode must be used inside <ThemeProvider>');
  return value;
};
