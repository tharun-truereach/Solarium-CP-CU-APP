/**
 * Root App component for Solarium Web Portal (WEBPRT)
 * Enhanced with environment configuration and build information
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import ErrorBoundary from './components/error/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import GlobalLoading from './components/GlobalLoading';
import SessionTimeout from './components/SessionTimeout';
import EnvironmentBanner from './components/EnvironmentBanner';
import AppRoutes from './routes/AppRoutes';
import { SolariumThemeProvider } from './theme/ThemeProvider';

const App: React.FC = () => {
  return (
    <SolariumThemeProvider>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <LoadingProvider>
            <AuthProvider>
              <AppRoutes />
              <GlobalLoading />
              <SessionTimeout
                warningTimeMinutes={5}
                sessionTimeoutMinutes={30}
                checkIntervalSeconds={60}
              />
              <EnvironmentBanner />
            </AuthProvider>
          </LoadingProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </SolariumThemeProvider>
  );
};

export default App;
