/**
 * RTK Query Base Query Configuration
 * Provides a single base query that uses the shared Axios instance
 * This ensures no duplicate interceptor logic (resolves Issue #2)
 */
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { AxiosRequestConfig, AxiosError } from 'axios';

// Import the shared Axios instance (will be created in sub-task 3)
// For now, we'll create a placeholder that will be replaced
let axiosInstance: any = null;

/**
 * Initialize the base query with the shared Axios instance
 * This will be called from the HTTP client setup in sub-task 3
 */
export const initializeBaseQuery = (sharedAxiosInstance: any) => {
  axiosInstance = sharedAxiosInstance;
  console.log('🔗 Base query initialized with shared Axios instance');
};

/**
 * Base query function for RTK Query
 * Uses the shared Axios instance to avoid duplicate interceptor logic
 */
export const baseQuery: BaseQueryFn<
  {
    url: string;
    method?: AxiosRequestConfig['method'];
    data?: AxiosRequestConfig['data'];
    params?: AxiosRequestConfig['params'];
    headers?: AxiosRequestConfig['headers'];
  },
  unknown,
  unknown
> = async ({ url, method = 'GET', data, params, headers }) => {
  try {
    // Ensure axios instance is available
    if (!axiosInstance) {
      throw new Error(
        'Axios instance not initialized. Call initializeBaseQuery first.'
      );
    }

    console.log(`🌐 RTK Query request: ${method} ${url}`, {
      data,
      dataType: typeof data,
      dataStringified: data ? JSON.stringify(data) : 'NO DATA',
      params,
      headers,
    });

    // Extra debugging for empty data
    if (
      !data &&
      (method === 'POST' || method === 'PUT' || method === 'PATCH')
    ) {
      console.error('🚨 EMPTY DATA in RTK Query baseQuery!', {
        url,
        method,
        originalData: data,
      });
    }

    // Make request using shared Axios instance
    // All interceptors (auth, retry, circuit breaker) are handled by the shared instance
    const result = await axiosInstance({
      url,
      method,
      data,
      params,
      headers,
    });

    console.log(`✅ RTK Query success: ${method} ${url}`, result.status);

    return {
      data: result.data,
      meta: {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
      },
    };
  } catch (axiosError) {
    const err = axiosError as AxiosError;

    console.error(`❌ RTK Query error: ${method} ${url}`, {
      status: err.response?.status,
      statusText: err.response?.statusText,
      message: err.message,
    });

    // Return error in RTK Query format
    // The shared Axios instance has already handled retries, redirects, etc.
    return {
      error: {
        status: err.response?.status || 'FETCH_ERROR',
        statusText: err.response?.statusText || 'Network Error',
        data: err.response?.data || err.message,
        message: err.message,
      },
    };
  }
};

/**
 * Enhanced base query with additional RTK Query features
 */
export const baseQueryWithReauth: BaseQueryFn<
  {
    url: string;
    method?: AxiosRequestConfig['method'];
    data?: AxiosRequestConfig['data'];
    params?: AxiosRequestConfig['params'];
    headers?: AxiosRequestConfig['headers'];
  },
  unknown,
  unknown
> = async (args, api, extraOptions) => {
  // Use the base query
  const result = await baseQuery(args, api, extraOptions);

  // Additional RTK Query specific logic can be added here
  // For example, handling specific error codes or adding retry logic
  // But we avoid duplicating what the shared Axios instance already handles

  return result;
};

/**
 * Utility functions for base query
 */
export const baseQueryUtils = {
  /**
   * Check if base query is initialized
   */
  isInitialized: (): boolean => {
    return axiosInstance !== null;
  },

  /**
   * Get base query configuration info
   */
  getInfo: () => {
    return {
      initialized: axiosInstance !== null,
      axiosInstanceType: axiosInstance ? typeof axiosInstance : 'undefined',
    };
  },

  /**
   * Create a pre-configured request object
   */
  createRequest: (
    url: string,
    method: AxiosRequestConfig['method'] = 'GET',
    options: Partial<{
      data: any;
      params: any;
      headers: Record<string, string>;
    }> = {}
  ) => ({
    url,
    method,
    ...options,
  }),
};

// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Base query module loaded');
}
