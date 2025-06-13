/**
 * Custom hook for handling errors in functional components
 * Provides error handling capabilities outside of Error Boundaries
 */

import { useCallback } from 'react';
import { errorLogger } from '@/services/errorLogger.service';
import { ErrorType } from '@/types/error.types';

interface UseErrorHandlerReturn {
  logError: (error: Error, context?: string) => string;
  logAsyncError: (error: Error, context?: string) => string;
  logNetworkError: (error: Error, context?: string) => string;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const logError = useCallback((error: Error, context?: string): string => {
    const enhancedError = context
      ? new Error(`${context}: ${error.message}`)
      : error;

    if (context && enhancedError.stack && error.stack) {
      enhancedError.stack = error.stack;
    }

    return errorLogger.logError(
      enhancedError,
      undefined,
      ErrorType.RUNTIME_ERROR
    );
  }, []);

  const logAsyncError = useCallback(
    (error: Error, context?: string): string => {
      const enhancedError = context
        ? new Error(`Async Error - ${context}: ${error.message}`)
        : error;

      if (context && enhancedError.stack && error.stack) {
        enhancedError.stack = error.stack;
      }

      return errorLogger.logError(
        enhancedError,
        undefined,
        ErrorType.ASYNC_ERROR
      );
    },
    []
  );

  const logNetworkError = useCallback(
    (error: Error, context?: string): string => {
      const enhancedError = context
        ? new Error(`Network Error - ${context}: ${error.message}`)
        : error;

      if (context && enhancedError.stack && error.stack) {
        enhancedError.stack = error.stack;
      }

      return errorLogger.logError(
        enhancedError,
        undefined,
        ErrorType.NETWORK_ERROR
      );
    },
    []
  );

  return {
    logError,
    logAsyncError,
    logNetworkError,
  };
};
