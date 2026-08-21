import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'xplainer-theme';

const readTheme = () => {
  if (typeof document === 'undefined') return 'dark';
  // index.html resolves the theme before first paint; trust that value.
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
};

const hasExplicitChoice = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    // Storage unavailable (private mode) — treat it as an explicit choice so we
    // do not fight the OS setting we cannot remember overriding.
    return true;
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Follow the OS until the user picks a theme themselves.
  useEffect(() => {
    if (hasExplicitChoice()) return;

    const query = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e) => setTheme(e.matches ? 'light' : 'dark');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Preference just won't survive a reload.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
};
