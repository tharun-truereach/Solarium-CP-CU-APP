/**
 * Error fallback UI component displayed when ErrorBoundary catches an error
 */

import React from 'react';
import { ErrorFallbackProps } from '@/types/error.types';

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  errorId,
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="error-fallback">
      <div className="error-fallback__container">
        <div className="error-fallback__icon">⚠️</div>

        <h1 className="error-fallback__title">Something went wrong</h1>

        <p className="error-fallback__subtitle">
          We&apos;re sorry, but something unexpected happened. Please try again.
        </p>

        {errorId && (
          <p className="error-fallback__error-id">
            Error ID: <code>{errorId}</code>
          </p>
        )}

        <div className="error-fallback__actions">
          {resetError && (
            <button
              type="button"
              className="error-fallback__button error-fallback__button--primary"
              onClick={resetError}
            >
              Try Again
            </button>
          )}

          <button
            type="button"
            className="error-fallback__button error-fallback__button--secondary"
            onClick={handleReload}
          >
            Reload Page
          </button>

          <button
            type="button"
            className="error-fallback__button error-fallback__button--tertiary"
            onClick={handleGoHome}
          >
            Go to Home
          </button>
        </div>

        {isDevelopment && error && (
          <details className="error-fallback__details">
            <summary className="error-fallback__details-summary">
              Technical Details (Development Only)
            </summary>
            <div className="error-fallback__technical">
              <h3>Error Message:</h3>
              <pre className="error-fallback__code">{error.message}</pre>

              {error.stack && (
                <>
                  <h3>Stack Trace:</h3>
                  <pre className="error-fallback__code">{error.stack}</pre>
                </>
              )}

              {errorInfo?.componentStack && (
                <>
                  <h3>Component Stack:</h3>
                  <pre className="error-fallback__code">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;
