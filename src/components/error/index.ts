/**
 * Error handling components barrel export
 */

export { default as ErrorBoundary } from './ErrorBoundary';
export { default as FeatureErrorBoundary } from './FeatureErrorBoundary';
export { default as ErrorFallback } from './ErrorFallback';
export { default as ErrorTestComponent } from './ErrorTestComponent';
export { default as GlobalErrorHandler } from './GlobalErrorHandler/index';

// Re-export types for convenience
export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorFallbackProps,
  ErrorInfo,
  LoggedError,
} from '@/types/error.types';
