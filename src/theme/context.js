import { createContext, useContext } from 'react';

/*
 * The theme has to be readable one level above the app so the header toggle and
 * every page share one source of truth for the active palette.
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
