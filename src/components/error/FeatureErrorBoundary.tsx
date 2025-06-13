/**
 * Specialized Error Boundary for feature modules
 * Provides isolated error handling for specific features
 */

import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { ErrorBoundaryProps, ErrorFallbackProps } from '@/types/error.types';
import './FeatureErrorBoundary.css';

interface FeatureErrorBoundaryProps
  extends Omit<ErrorBoundaryProps, 'fallback'> {
  featureName: string;
  fallbackMessage?: string;
}

const FeatureFallback: React.FC<
  ErrorFallbackProps & { featureName: string; fallbackMessage?: string }
> = ({ error, resetError, errorId, featureName, fallbackMessage }) => {
  console.log('errorId', error);
  return (
    <div className="feature-error-boundary">
      <div className="feature-error-boundary__content">
        <div className="feature-error-boundary__icon">⚠️</div>
        <h3 className="feature-error-boundary__title">
          {featureName} is temporarily unavailable
        </h3>
        <p className="feature-error-boundary__message">
          {fallbackMessage ||
            "We're experiencing technical difficulties with this feature. Please try again."}
        </p>
        {errorId !== '' && (
          <p className="feature-error-boundary__error-id">
            Error ID: <code>{errorId}</code>
          </p>
        )}
        {resetError && (
          <button
            type="button"
            className="feature-error-boundary__retry"
            onClick={resetError}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

const FeatureErrorBoundary: React.FC<FeatureErrorBoundaryProps> = ({
  featureName,
  fallbackMessage,
  children,
  onError,
  isolate = true,
}) => {
  const customFallback = (props: ErrorFallbackProps) => (
    <FeatureFallback
      {...props}
      featureName={featureName}
      fallbackMessage={fallbackMessage ?? ''}
      errorId={props.errorId ?? ''}
    />
  );

  return (
    <ErrorBoundary
      fallback={customFallback}
      {...(onError ? { onError } : {})}
      isolate={isolate}
    >
      {children}
    </ErrorBoundary>
  );
};

export default FeatureErrorBoundary;
