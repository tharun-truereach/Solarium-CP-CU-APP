/**
 * Error logging service for the Solarium Web Portal
 * Handles logging errors to console (development) and future logging services (production)
 */

import { ErrorInfo, LoggedError, ErrorType } from '@/types/error.types';

class ErrorLoggerService {
  private errors: LoggedError[] = [];
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Generate a unique error ID for tracking
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an error with full context information
   */
  public logError(
    error: Error,
    errorInfo?: ErrorInfo,
    errorType: ErrorType = ErrorType.RUNTIME_ERROR
  ): string {
    const errorId = this.generateErrorId();

    const loggedError: LoggedError = {
      id: errorId,
      type: errorType,
      message: error.message,
      stack: error.stack || undefined,
      componentStack: errorInfo?.componentStack || undefined,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Store error for potential reporting
    this.errors.push(loggedError);

    // Log to console in development, structured logging in production
    if (this.isProduction) {
      this.logToProduction(loggedError);
    } else {
      this.logToDevelopment(loggedError, error, errorInfo);
    }

    return errorId;
  }

  /**
   * Development logging with full details
   */
  private logToDevelopment(
    loggedError: LoggedError,
    originalError: Error,
    errorInfo?: ErrorInfo
  ): void {
    console.group(`🚨 Error Boundary Caught Error [${loggedError.id}]`);
    console.error('Error:', originalError);
    console.error('Error Message:', loggedError.message);
    console.error('Stack Trace:', loggedError.stack);

    if (errorInfo?.componentStack) {
      console.error('Component Stack:', errorInfo.componentStack);
    }

    console.error('Error Context:', {
      timestamp: loggedError.timestamp,
      url: loggedError.url,
      userAgent: loggedError.userAgent,
      type: loggedError.type,
    });
    console.groupEnd();
  }

  /**
   * Production logging (structured for future service integration)
   */
  private logToProduction(loggedError: LoggedError): void {
    // In production, we would send to a logging service like Azure Application Insights
    // For now, we log a structured error without exposing sensitive stack traces
    console.error('Application Error:', {
      id: loggedError.id,
      type: loggedError.type,
      message: loggedError.message,
      timestamp: loggedError.timestamp.toISOString(),
      url: loggedError.url,
    });

    // TODO: Integrate with Azure Application Insights or other logging service
    // Example: ApplicationInsights.trackException({ exception: loggedError })
  }

  /**
   * Get all logged errors (for debugging or reporting)
   */
  public getErrors(): LoggedError[] {
    return [...this.errors];
  }

  /**
   * Clear error log (useful for testing or memory management)
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Log component-specific errors
   */
  public logComponentError(error: Error, componentName: string): string {
    const enhancedError = new Error(
      `Component Error in ${componentName}: ${error.message}`
    );
    if (error.stack) {
      enhancedError.stack = error.stack;
    }
    return this.logError(enhancedError, undefined, ErrorType.COMPONENT_ERROR);
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggerService();
