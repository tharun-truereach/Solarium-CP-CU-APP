/**
 * Error-related type definitions for the Solarium Web Portal
 */

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  errorId?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
}

export interface ErrorFallbackProps {
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  resetError?: () => void;
  errorId?: string;
}

export enum ErrorType {
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  ASYNC_ERROR = 'ASYNC_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface LoggedError {
  id: string;
  type: ErrorType;
  message: string;
  stack?: string | undefined;
  componentStack?: string | undefined;
  timestamp: Date;
  userAgent?: string | undefined;
  url?: string | undefined;
}
