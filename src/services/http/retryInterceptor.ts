/**
 * Retry interceptor for Axios with exponential backoff
 * Provides automatic retry functionality for failed requests
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { isNetworkError, isTimeoutError, isServerError } from './errorMapper';

/**
 * Retry configuration interface
 */
export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
  retryDelayCalculator?: (retryCount: number, baseDelay: number) => number;
  onRetry?: (retryCount: number, error: AxiosError) => void;
}

/**
 * Default retry configuration
 */
const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000, // 1 second base delay
  retryCondition: (error: AxiosError) => {
    // Retry on network errors, timeouts, and server errors
    return (
      isNetworkError(error) || isTimeoutError(error) || isServerError(error)
    );
  },
  retryDelayCalculator: (retryCount: number, baseDelay: number) => {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add up to 10% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  },
  onRetry: (retryCount: number, error: AxiosError) => {
    console.log(
      `🔄 Retrying request (attempt ${retryCount}):`,
      error.config?.url
    );
  },
};

/**
 * Setup retry interceptor for an Axios instance
 * @param axiosInstance - Axios instance to add retry to
 * @param config - Retry configuration
 */
export const setupRetry = (
  axiosInstance: AxiosInstance,
  config: Partial<RetryConfig> = {}
): void => {
  const retryConfig = { ...defaultRetryConfig, ...config };

  // Add response interceptor for retry logic
  axiosInstance.interceptors.response.use(
    // Success response - no retry needed
    response => response,

    // Error response - check if retry is needed
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & {
        __retryCount?: number;
        __retryDelay?: number;
      };

      // Initialize retry count if not present
      if (!originalRequest.__retryCount) {
        originalRequest.__retryCount = 0;
      }

      // Check if we should retry this error
      const shouldRetry =
        originalRequest.__retryCount < retryConfig.retries &&
        retryConfig.retryCondition!(error) &&
        originalRequest.method !== 'post'; // Don't retry POST by default to avoid duplicate actions

      if (shouldRetry) {
        originalRequest.__retryCount++;

        // Calculate delay for this retry attempt
        const delay = retryConfig.retryDelayCalculator!(
          originalRequest.__retryCount,
          retryConfig.retryDelay
        );

        // Call onRetry callback if provided
        if (retryConfig.onRetry) {
          retryConfig.onRetry(originalRequest.__retryCount, error);
        }

        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the request
        try {
          console.log(
            `🔄 Executing retry ${originalRequest.__retryCount} for ${originalRequest.url}`
          );
          return await axiosInstance(originalRequest);
        } catch (retryError) {
          // If retry also fails, continue with the retry logic
          return Promise.reject(retryError);
        }
      }

      // No more retries or retry condition not met
      if (originalRequest.__retryCount && originalRequest.__retryCount > 0) {
        console.error(
          `❌ Request failed after ${originalRequest.__retryCount} retries:`,
          originalRequest.url
        );
      }

      return Promise.reject(error);
    }
  );

  console.log('🔄 Retry interceptor configured:', {
    maxRetries: retryConfig.retries,
    baseDelay: retryConfig.retryDelay,
    retryCondition: retryConfig.retryCondition?.name || 'default',
  });
};

/**
 * Create a retry-enabled Axios instance
 * @param baseConfig - Base Axios configuration
 * @param retryConfig - Retry configuration
 * @returns Configured Axios instance with retry
 */
export const createRetryableAxiosInstance = (
  baseConfig: AxiosRequestConfig = {},
  retryConfig: Partial<RetryConfig> = {}
) => {
  const instance = axios.create(baseConfig);

  setupRetry(instance, retryConfig);

  return instance;
};

/**
 * Utility to manually retry a failed request
 * @param axiosInstance - Axios instance
 * @param originalRequest - Original request configuration
 * @param retryConfig - Retry configuration
 * @returns Promise that resolves with response or rejects with final error
 */
export const manualRetry = async (
  axiosInstance: AxiosInstance,
  originalRequest: AxiosRequestConfig,
  retryConfig: Partial<RetryConfig> = {}
): Promise<any> => {
  const config = { ...defaultRetryConfig, ...retryConfig };
  let lastError: AxiosError;

  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(
        `🔄 Manual retry attempt ${attempt} for ${originalRequest.url}`
      );

      const response = await axiosInstance(originalRequest);
      console.log(`✅ Manual retry succeeded on attempt ${attempt}`);
      return response;
    } catch (error) {
      lastError = error as AxiosError;

      // Check if we should continue retrying
      if (attempt < config.retries && config.retryCondition!(lastError)) {
        const delay = config.retryDelayCalculator!(attempt, config.retryDelay);

        if (config.onRetry) {
          config.onRetry(attempt, lastError);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  console.error(`❌ Manual retry failed after ${config.retries} attempts`);
  throw lastError!;
};

/**
 * Export retry utilities
 */
export const retryUtils = {
  setupRetry,
  createRetryableAxiosInstance,
  manualRetry,
  defaultRetryConfig,
};

export default retryUtils;
