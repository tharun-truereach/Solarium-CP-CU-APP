/**
 * Main routing configuration for the Solarium Web Portal
 * Enhanced with foundation screens and error handling
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import ProtectedRoute from './ProtectedRoute';
// import { PageLoader } from '../components/loading';
import { Box, CircularProgress } from '@mui/material';
import { MainLayout } from '../layout';

// Regular imports for critical pages
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import AccessDenied from '../pages/AccessDenied';
import SessionExpired from '../pages/SessionExpired';
import ServerError from '../pages/ServerError';

// Password reset pages
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Settings page
import SettingsPage from '../pages/settings/SettingsPage';

// Profile page
import MyProfilePage from '../pages/MyProfilePage';
import NotificationsPage from '../pages/NotificationsPage';

// Lazy imports for demonstration
const LazyExample = lazy(() => import('../pages/LazyExample'));

// Enhanced loading component for route transitions
const RouteLoading: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="200px"
  >
    <CircularProgress />
  </Box>
);

// Wrap lazy components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  const WrappedComponent = () => (
    <Suspense fallback={<RouteLoading />}>
      <Component />
    </Suspense>
  );
  return WrappedComponent;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.SESSION_EXPIRED} element={<SessionExpired />} />

        {/* Home redirect to dashboard */}
        <Route
          path={ROUTES.HOME}
          element={<Navigate to={ROUTES.DASHBOARD} replace />}
        />

        {/* Protected Routes */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute requiredRoles={['admin', 'kam']}>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Example lazy-loaded route */}
        <Route
          path="/lazy-example"
          element={
            <ProtectedRoute requiredRoles={['admin', 'kam']}>
              <MainLayout>{withSuspense(LazyExample)()}</MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Future protected routes (placeholders) */}
        <Route
          path={ROUTES.LEADS}
          element={
            <ProtectedRoute requiredRoles={['admin', 'kam']}>
              <MainLayout>
                <div className="placeholder-page">
                  <h1>Leads Management</h1>
                  <p>This page will be implemented in future tasks.</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.QUOTATIONS}
          element={
            <ProtectedRoute requiredRoles={['admin', 'kam']}>
              <MainLayout>
                <div className="placeholder-page">
                  <h1>Quotations</h1>
                  <p>This page will be implemented in future tasks.</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.CHANNEL_PARTNERS}
          element={
            <ProtectedRoute requiredRoles={['admin', 'kam']}>
              <MainLayout>
                <div className="placeholder-page">
                  <h1>Channel Partners</h1>
                  <p>This page will be implemented in future tasks.</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.CUSTOMERS}
          element={
            <ProtectedRoute requiredRoles={['admin', 'kam']}>
              <MainLayout>
                <div className="placeholder-page">
                  <h1>Customers</h1>
                  <p>This page will be implemented in future tasks.</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path={ROUTES.COMMISSIONS}
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <MainLayout>
                <div className="placeholder-page">
                  <h1>Commissions</h1>
                  <p>
                    Admin-only page. This will be implemented in future tasks.
                  </p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.MASTER_DATA}
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <MainLayout>
                <div className="placeholder-page">
                  <h1>Master Data Management</h1>
                  <p>
                    Admin-only page. This will be implemented in future tasks.
                  </p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Profile & Notification Routes - Accessible to all authenticated users */}
        <Route
          path={ROUTES.MY_PROFILE}
          element={
            <ProtectedRoute>
              <MainLayout>
                <MyProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.NOTIFICATIONS}
          element={
            <ProtectedRoute>
              <MainLayout>
                <NotificationsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Error Routes */}
        <Route path={ROUTES.ACCESS_DENIED} element={<AccessDenied />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        <Route path={ROUTES.SERVER_ERROR} element={<ServerError />} />

        {/* Catch-all route for 404 */}
        <Route path={ROUTES.WILDCARD} element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
