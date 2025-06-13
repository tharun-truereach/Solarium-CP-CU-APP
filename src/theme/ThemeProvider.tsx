/**
 * Custom Theme Provider component for Solarium Web Portal
 * Wraps the application with Material UI theme and global styles
 */
import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './index';

interface themeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme provider that wraps the entire application
 * Provides Material UI theme and CSS baseline normalization
 */
export const SolariumThemeProvider: React.FC<themeProviderProps> = ({
  children,
}) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
