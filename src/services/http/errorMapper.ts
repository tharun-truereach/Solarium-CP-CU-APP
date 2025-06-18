/**
 * HTTP Error mapping utilities
 * Maps HTTP status codes to user-friendly messages
 */

import { ERROR_MESSAGES } from '../../utils/constants';

/**
 * HTTP status code to user-friendly message mapping
 */
const statusMessageMap: Record<number, string> = {
  // 4xx Client Errors
  400: 'Invalid request. Please check your input and try again.',
  401: 'Authentication required. Please log in again.',
  403: 'Access denied. You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  405: 'This operation is not allowed.',
  408: 'Request timeout. Please try again.',
  409: 'Conflict detected. The resource may have been modified by another user.',
  410: 'The requested resource is no longer available.',
  413: 'File or request is too large.',
  415: 'Unsupported file type or format.',
  422: 'Validation failed. Please check your input.',
  429: 'Too many requests. Please wait a moment and try again.',

  // 5xx Server Errors
  500: 'Internal server error. Please try again later.',
  501: 'This feature is not implemented yet.',
  502: 'Server is temporarily unavailable. Please try again later.',
  503: 'Service is temporarily unavailable. Please try again later.',
  504: 'Request timeout. The server took too long to respond.',
  505: 'HTTP version not supported.',
};

/**
 * Map HTTP status code to user-friendly message
 * @param status - HTTP status code
 * @param customMessage - Optional custom message from server
 * @returns User-friendly error message
 */
export const mapHttpError = (
  status: number,
  customMessage?: string
): string => {
  // Use custom message if provided and it's meaningful
  if (customMessage && customMessage.length > 0 && customMessage !== 'Error') {
    return customMessage;
  }

  // Use predefined message for status code
  if (statusMessageMap[status]) {
    return statusMessageMap[status];
  }

  // Fall back to generic messages by status code range
  if (status >= 400 && status < 500) {
    return 'Client error occurred. Please check your request and try again.';
  } else if (status >= 500) {
    return 'Server error occurred. Please try again later.';
  }

  // Default fallback
  return ERROR_MESSAGES.GENERIC_ERROR;
};

/**
 * Extract error message from various error response formats
 * @param error - Error object from API response
 * @returns Extracted error message
 */
export const extractErrorMessage = (error: any): string => {
  // Handle RTK Query error format
  if (error?.data) {
    if (typeof error.data === 'string') {
      return error.data;
    }
    if (error.data.message) {
      return error.data.message;
    }
    if (error.data.error) {
      return error.data.error;
    }
    if (error.data.details) {
      return error.data.details;
    }
  }

  // Handle Axios error format
  if (error?.response?.data) {
    if (typeof error.response.data === 'string') {
      return error.response.data;
    }
    if (error.response.data.message) {
      return error.response.data.message;
    }
    if (error.response.data.error) {
      return error.response.data.error;
    }
  }

  // Handle standard Error object
  if (error?.message) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES.GENERIC_ERROR;
};

/**
 * Check if error is a network error
 * @param error - Error object
 * @returns True if it's a network error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.status === 'FETCH_ERROR' ||
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('fetch') ||
    !error?.response
  );
};

/**
 * Check if error is a timeout error
 * @param error - Error object
 * @returns True if it's a timeout error
 */
export const isTimeoutError = (error: any): boolean => {
  return (
    error?.status === 'TIMEOUT_ERROR' ||
    error?.code === 'ECONNABORTED' ||
    error?.message?.includes('timeout') ||
    error?.response?.status === 408 ||
    error?.response?.status === 504
  );
};

/**
 * Check if error is a server error (5xx)
 * @param error - Error object
 * @returns True if it's a server error
 */
export const isServerError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return typeof status === 'number' && status >= 500;
};

/**
 * Check if error is a client error (4xx)
 * @param error - Error object
 * @returns True if it's a client error
 */
export const isClientError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
};

/**
 * Format error for display with appropriate icon/severity
 * @param error - Error object
 * @returns Formatted error object for UI display
 */
export const formatErrorForDisplay = (error: any) => {
  const message = extractErrorMessage(error);
  const status = error?.status || error?.response?.status;

  let severity: 'error' | 'warning' | 'info' = 'error';
  let icon = '🚨';

  if (isNetworkError(error)) {
    severity = 'warning';
    icon = '🌐';
  } else if (isTimeoutError(error)) {
    severity = 'warning';
    icon = '⏰';
  } else if (status === 401) {
    severity = 'info';
    icon = '🔐';
  } else if (status === 403) {
    severity = 'warning';
    icon = '🚫';
  } else if (status === 404) {
    severity = 'info';
    icon = '🔍';
  }

  return {
    message,
    severity,
    icon,
    status,
    isRetryable:
      isNetworkError(error) || isTimeoutError(error) || isServerError(error),
  };
};

/**
 * Error mapper utilities object
 */
export const errorMapper = {
  mapHttpError,
  extractErrorMessage,
  isNetworkError,
  isTimeoutError,
  isServerError,
  isClientError,
  formatErrorForDisplay,
};

export default errorMapper;
