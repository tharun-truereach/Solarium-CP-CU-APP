/**
 * Global Error Handler Component
 *
 * Top-level error boundary that wraps the entire application.
 * Catches all unhandled errors and provides consistent error handling
 * across the Solarium Web Portal.
 */
import React from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { ErrorFallbackProps } from '@/types/error.types';
import ErrorFallback from '../ErrorFallback';

/**
 * Props for GlobalErrorHandler
 */
interface GlobalErrorHandlerProps {
  children: React.ReactNode;
}

/**
 * Global error fallback with application-specific styling
 */
const GlobalErrorFallback: React.FC<ErrorFallbackProps> = props => {
  return <ErrorFallback {...props} />;
};

/**
 * Global error handler for application-wide error catching
 */
const GlobalErrorHandler: React.FC<GlobalErrorHandlerProps> = ({
  children,
}) => {
  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Global error handling logic
    console.error('Global Error Handler caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });

    // In production, you might want to send this to an external service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external error reporting service
      // Example: Sentry, LogRocket, Azure Application Insights, etc.
    }
  };

  return (
    <ErrorBoundary fallback={GlobalErrorFallback} onError={handleGlobalError}>
      {children}
    </ErrorBoundary>
  );
};

export default GlobalErrorHandler;
