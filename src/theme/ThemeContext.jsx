import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeContext } from './context';

/** Owns the single theme value for the whole tree. */
export const ThemeProvider = ({ children }) => {
  const value = useTheme();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
