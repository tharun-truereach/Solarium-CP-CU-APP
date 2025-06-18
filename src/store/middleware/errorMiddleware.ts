import {
  Middleware,
  MiddlewareAPI,
  Dispatch,
  AnyAction,
} from '@reduxjs/toolkit';
import { RootState } from '../index';
import { showError } from '../slices/uiSlice';
import { isApiRejectedAction } from '../../api/apiSlice';

const IGNORED_ERROR_TYPES = [
  'auth/login/rejected',
  'auth/logout/rejected',
  'persist/REHYDRATE',
];

const extractErrorMessage = (error: any): string => {
  if (error && typeof error === 'object') {
    if (error.message) return error.message;
    if (error.data?.message) return error.data.message;
    if (error.error?.message) return error.error.message;
  }

  if (typeof error === 'string') return error;

  return 'An unexpected error occurred. Please try again.';
};

const determineErrorSeverity = (
  error: any
): 'error' | 'warning' | 'info' | 'success' => {
  if (error && typeof error === 'object') {
    if (error.status === 0 || error.code === 'NETWORK_ERROR') {
      return 'warning';
    }

    if (error.status >= 500) {
      return 'warning';
    }

    if (error.isCircuitBreakerError) {
      return 'warning';
    }
  }

  return 'error';
};

export const errorMiddleware: Middleware<Record<string, never>, RootState> =
  (storeAPI: MiddlewareAPI<Dispatch, RootState>) =>
  (next: Dispatch) =>
  (action: AnyAction) => {
    const result = next(action);

    if (
      action.type.endsWith('/rejected') &&
      !IGNORED_ERROR_TYPES.includes(action.type)
    ) {
      const error = action.payload || action.error;

      if (isApiRejectedAction(action)) {
        const errorMessage = extractErrorMessage(error);
        const severity = determineErrorSeverity(error);

        storeAPI.dispatch(
          showError({
            message: errorMessage,
            severity,
          })
        );
      } else if (action.error) {
        const errorMessage = extractErrorMessage(action.error);
        const severity = determineErrorSeverity(action.error);

        storeAPI.dispatch(
          showError({
            message: errorMessage,
            severity,
          })
        );
      }
    }

    if (action.type === 'network/error') {
      storeAPI.dispatch(
        showError({
          message:
            'Network connection failed. Please check your connection and try again.',
          severity: 'error',
        })
      );
    }

    if (action.type === 'circuitBreaker/opened') {
      storeAPI.dispatch(
        showError({
          message:
            'Service temporarily unavailable. Please try again in a few moments.',
          severity: 'warning',
        })
      );
    }

    return result;
  };

export default errorMiddleware;
