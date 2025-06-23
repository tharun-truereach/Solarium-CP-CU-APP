/**
 * Root App component for Solarium Web Portal (WEBPRT)
 * Enhanced with environment configuration and build information
 */
import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import ErrorBoundary from './components/error/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import GlobalLoading from './components/GlobalLoading';
import SessionTimeout from './components/SessionTimeout';
import EnvironmentBanner from './components/EnvironmentBanner';
import AppRoutes from './routes/AppRoutes';
import DebugConsole from './components/DebugConsole';
import { SolariumThemeProvider } from './theme/ThemeProvider';
import { store, persistor } from './store';
import { useHttpClient } from './hooks/useHttpClient';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { FeatureFlagDebugger } from './components';

const PersistenceLoadingComponent: React.FC = () => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
    gap={2}
  >
    <CircularProgress size={60} thickness={4} />
    <Typography variant="h6" color="textSecondary">
      Loading application...
    </Typography>
  </Box>
);

const HttpClientInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useHttpClient();
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate
          loading={<PersistenceLoadingComponent />}
          persistor={persistor}
        >
          <FeatureFlagProvider>
            <SolariumThemeProvider>
              <CssBaseline />
              <AuthProvider>
                <LoadingProvider>
                  <Suspense fallback={<PersistenceLoadingComponent />}>
                    <BrowserRouter>
                      <HttpClientInitializer>
                        <EnvironmentBanner />
                        <AppRoutes />
                        <GlobalLoading />
                        <SessionTimeout
                          warningTimeMinutes={5}
                          sessionTimeoutMinutes={30}
                          checkIntervalSeconds={60}
                        />
                        <DebugConsole />
                        <FeatureFlagDebugger />
                      </HttpClientInitializer>
                    </BrowserRouter>
                  </Suspense>
                </LoadingProvider>
              </AuthProvider>
            </SolariumThemeProvider>
          </FeatureFlagProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
