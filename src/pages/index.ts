/**
 * Pages barrel file for Solarium Web Portal
 * Re-exports all page components for easy importing
 */

// Authentication pages
export { default as ForgotPasswordPage } from './auth/ForgotPasswordPage';
export { default as ResetPasswordPage } from './auth/ResetPasswordPage';

// Dashboard pages (to be implemented in future tasks)
// export { default as DashboardPage } from './dashboard/DashboardPage';
// export { default as OverviewPage } from './dashboard/OverviewPage';

// Lead management pages (to be implemented in future tasks)
// export { default as LeadsListPage } from './leads/LeadsListPage';
// export { default as LeadDetailsPage } from './leads/LeadDetailsPage';

// Error pages (to be implemented in future tasks)
// export { default as NotFoundPage } from './errors/NotFoundPage';
// export { default as AccessDeniedPage } from './errors/AccessDeniedPage';

// Currently available pages
export { default as Dashboard } from './Dashboard';
export { default as Login } from './Login';
export { default as NotFound } from './NotFound';
export { default as AccessDenied } from './AccessDenied';
export { default as SessionExpired } from './SessionExpired';
export { default as ServerError } from './ServerError';
export { default as LazyExample } from './LazyExample';
export {
  ErrorBoundary,
  ErrorFallback,
  GlobalErrorHandler,
} from '../components/error';

// Add this line to existing exports
export * from './leads';
