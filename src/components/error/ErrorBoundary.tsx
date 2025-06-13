/**
 * Error Boundary component for catching and handling React component errors
 * Provides reusable error handling for the Solarium Web Portal
 */

import { Component, ReactNode } from 'react';
import {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorInfo,
} from '@/types/error.types';
import { errorLogger } from '@/services/errorLogger.service';
import ErrorFallback from './ErrorFallback';
import './ErrorFallback.css';

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  /**
   * Static method called when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to trigger error UI
    return { hasError: true, error };
  }

  /**
   * Called when an error is caught - handles logging and state updates
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error with full context
    const errorId = errorLogger.logError(error, errorInfo);

    // Update state with error details and ID
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In non-production environments, log additional context
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  /**
   * Reset error state to retry rendering
   */
  private resetError = (): void => {
    // Clear any pending reset timeout
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    // Reset state immediately
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  /**
   * Cleanup timeouts on unmount
   */
  override componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback component if provided, otherwise use default
      const FallbackComponent = this.props.fallback || ErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error ?? null}
          errorInfo={this.state.errorInfo ?? null}
          resetError={this.resetError}
          errorId={this.state.errorId ?? ''}
        />
      );
    }

    // If isolated, wrap children in a div to prevent error propagation
    if (this.props.isolate) {
      return (
        <div className="error-boundary-isolate">{this.props.children}</div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
