import { ERROR_MESSAGES } from './constants';

export interface StandardError {
  status: number;
  code: string;
  message: string;
  details?: any;
}

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  405: 'This action is not allowed.',
  408: 'Request timeout. Please try again.',
  409: 'This action conflicts with current data. Please refresh and try again.',
  422: 'Invalid data provided. Please check your input.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Internal server error. Please try again later.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service temporarily unavailable for maintenance.',
  504: 'Request timeout. Please try again.',
  0: 'Network connection failed. Please check your internet connection.',
};

export const mapStatusToMessage = (status: number): string => {
  return HTTP_ERROR_MESSAGES[status] || ERROR_MESSAGES.GENERIC_ERROR;
};

export const mapStatusToCode = (status: number): string => {
  if (status >= 400 && status < 500) return 'CLIENT_ERROR';
  if (status >= 500 && status < 600) return 'SERVER_ERROR';
  if (status === 0) return 'NETWORK_ERROR';
  return 'UNKNOWN_ERROR';
};

export const createStandardError = (
  status: number,
  details?: any
): StandardError => {
  return {
    status,
    code: mapStatusToCode(status),
    message: mapStatusToMessage(status),
    details,
  };
};

export const isRetryableError = (status: number): boolean => {
  const retryableStatuses = [408, 429, 500, 502, 503, 504, 507];
  return retryableStatuses.includes(status) || status === 0;
};

export const getRetryDelay = (
  attemptNumber: number,
  baseDelay = 300
): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attemptNumber);
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
  const maxDelay = 10000;
  return Math.min(exponentialDelay + jitter, maxDelay);
};

export const shouldEnableRetries = (): boolean => {
  return process.env.NODE_ENV !== 'test';
};
