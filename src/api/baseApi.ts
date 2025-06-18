/**
 * Enhanced Base RTK Query API configuration for Solarium Web Portal
 * Provides shared API slice with authentication, error handling, retry logic, and token refresh
 */

import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query';
import { config } from '../config/environment';
import type { RootState } from '../store/store';
import {
  logout,
  updateTokens,
  sessionExpired,
} from '../store/slices/authSlice';
import { Mutex } from 'async-mutex';

/**
 * Mutex to prevent multiple simultaneous refresh token requests
 */
const refreshMutex = new Mutex();

/**
 * Enhanced base query with automatic token injection, retry logic, and refresh handling
 */
const baseQuery = fetchBaseQuery({
  baseUrl: config.apiBaseUrl,
  timeout: config.apiTimeout,

  prepareHeaders: (headers, { getState, endpoint }) => {
    // Get the current auth token from state
    const state = getState() as RootState;
    const token = state.auth.token;

    // Add authorization header if token exists
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    // Add common headers
    headers.set('content-type', 'application/json');
    headers.set('accept', 'application/json');

    // Add correlation ID for request tracing
    const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    headers.set('x-correlation-id', correlationId);

    // Add client metadata
    headers.set('x-client-type', 'web-portal');
    headers.set('x-client-version', config.version);

    // Add environment info for debugging (only in non-production)
    if (config.environment !== 'PROD') {
      headers.set('x-environment', config.environment);
    }

    // Custom headers for specific endpoints
    if (endpoint === 'refreshToken') {
      headers.set('x-refresh-request', 'true');
    }

    return headers;
  },

  // Handle response errors globally
  responseHandler: async response => {
    // Log response information for debugging
    if (config.environment === 'DEV') {
      console.log(
        `🌐 API Response: ${response.status} ${response.statusText} - ${response.url}`
      );
    }

    // Handle specific status codes
    if (response.status === 204) {
      // No content responses
      return {};
    }

    if (response.status >= 200 && response.status < 300) {
      // Success responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    }

    // Let error handling be done by the error handler
    return response;
  },

  // Validate response status
  validateStatus: response => {
    return response.status >= 200 && response.status < 300;
  },
});

/**
 * Enhanced base query with automatic token refresh and comprehensive error handling
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  Record<string, unknown>,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  // Execute the base query
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized responses with token refresh
  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    console.log('🔐 401 Unauthorized detected - attempting token refresh...');

    if (refreshToken) {
      // Use mutex to prevent multiple simultaneous refresh requests
      const release = await refreshMutex.acquire();

      try {
        // Check if another request already refreshed the token
        const currentState = api.getState() as RootState;
        const currentToken = currentState.auth.token;

        // If token has changed since our request, retry with new token
        if (currentToken !== state.auth.token) {
          console.log(
            '🔐 Token already refreshed by another request, retrying...'
          );
          result = await baseQuery(args, api, extraOptions);
          return result;
        }

        // Attempt token refresh
        console.log('🔐 Attempting token refresh...');
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          console.log('✅ Token refresh successful');

          // Extract new tokens from refresh response
          const {
            token: newToken,
            refreshToken: newRefreshToken,
            expiresAt,
          } = refreshResult.data as any;

          // Update tokens in store
          api.dispatch(
            updateTokens({
              token: newToken,
              refreshToken: newRefreshToken,
              expiresAt,
            })
          );

          // Retry the original request with new token
          console.log('🔄 Retrying original request with new token...');
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed - logout user
          console.warn('❌ Token refresh failed - logging out user');
          api.dispatch(sessionExpired());
          api.dispatch(logout());

          // Redirect to session expired page
          if (typeof window !== 'undefined') {
            window.location.href = '/session-expired';
          }
        }
      } catch (refreshError) {
        console.error('❌ Token refresh error:', refreshError);
        api.dispatch(sessionExpired());
        api.dispatch(logout());

        // Redirect to session expired page
        if (typeof window !== 'undefined') {
          window.location.href = '/session-expired';
        }
      } finally {
        release();
      }
    } else {
      // No refresh token available - logout user
      console.warn('🔐 No refresh token available - logging out user');
      api.dispatch(sessionExpired());
      api.dispatch(logout());

      // Redirect to session expired page
      if (typeof window !== 'undefined') {
        window.location.href = '/session-expired';
      }
    }
  }

  // Handle 403 Forbidden responses
  if (result.error && result.error.status === 403) {
    console.warn('🚫 403 Forbidden - insufficient permissions');

    // Dispatch custom event for global error handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('api:forbidden', {
          detail: {
            endpoint: typeof args === 'string' ? args : args.url,
            error: result.error,
          },
        })
      );

      // Redirect to access denied page
      setTimeout(() => {
        window.location.href = '/access-denied';
      }, 100);
    }
  }

  // Handle 429 Too Many Requests
  if (result.error && result.error.status === 429) {
    console.warn('⏳ 429 Too Many Requests - rate limited');

    // Dispatch custom event for rate limiting handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('api:rateLimit', {
          detail: {
            endpoint: typeof args === 'string' ? args : args.url,
            error: result.error,
            retryAfter: result.meta?.response?.headers?.get('retry-after'),
          },
        })
      );
    }
  }

  // Handle 5xx Server Errors
  if (
    result.error &&
    typeof result.error.status === 'number' &&
    result.error.status >= 500
  ) {
    console.error('🚨 Server error detected:', result.error.status);

    // Dispatch custom event for server error handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('api:serverError', {
          detail: {
            endpoint: typeof args === 'string' ? args : args.url,
            error: result.error,
            status: result.error.status,
          },
        })
      );
    }
  }

  // Log successful requests in development
  if (config.environment === 'DEV' && !result.error) {
    const endpoint = typeof args === 'string' ? args : args.url;
    console.log(`✅ API Success: ${endpoint}`);
  }

  return result;
};

/**
 * Create retry-enabled base query with exponential backoff
 */
const baseQueryWithRetry = retry(baseQueryWithReauth, {
  maxRetries: 3,
});

/**
 * Enhanced Base API slice configuration
 * All feature-specific API slices should extend this base API
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,

  // Global tag types for cache invalidation across all API slices
  tagTypes: [
    'User',
    'Auth',
    'Lead',
    'Quotation',
    'Commission',
    'ChannelPartner',
    'Customer',
    'MasterData',
    'Analytics',
    'Settings',
    'Notification',
  ],

  // Cache configuration
  keepUnusedDataFor: 60, // Keep unused data for 60 seconds

  // Refetch configuration
  refetchOnMountOrArgChange: 30, // Refetch if data is older than 30 seconds
  refetchOnFocus: true, // Refetch when user returns to tab
  refetchOnReconnect: true, // Refetch on network reconnect

  // Initial empty endpoints object
  // Feature-specific endpoints will be injected using injectEndpoints
  endpoints: () => ({}),

  // Extract common response data structure
  extractRehydrationInfo: (action, { reducerPath }) => {
    if (action.type === 'persist/REHYDRATE') {
      return action.payload?.[reducerPath];
    }
  },
});

/**
 * Export enhanced utility functions
 */
export const {
  // Utility functions for cache management
  util: {
    resetApiState,
    invalidateTags,
    selectInvalidatedBy,

    updateQueryData,
    upsertQueryData,
    getRunningQueriesThunk,
    getRunningMutationsThunk,
  },

  // Reducer path for store integration
  reducerPath,

  // Middleware for store configuration
  middleware,
} = baseApi;

/**
 * Enhanced API utilities for development, debugging, and cache management
 */
export const apiUtils = {
  /**
   * Reset all API cache and state
   */
  resetAll: () => {
    console.log('🗑️ Resetting all API cache...');
    return baseApi.util.resetApiState();
  },

  /**
   * Invalidate specific tags to trigger refetch
   */
  invalidate: (tags: string[]) => {
    console.log('♻️ Invalidating tags:', tags);
    return tags.map(tag => ({ type: tag as any }));
  },

  /**
   * Get API cache statistics (development only)
   */
  getCacheStats: () => {
    if (config.environment === 'DEV') {
      return {
        message: 'Cache stats available in Redux DevTools under api.queries',
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  },

  /**
   * Prefetch data for performance optimization
   */
  prefetch: async (endpoint: string, arg: any) => {
    console.log('🚀 Prefetching:', endpoint, arg);
    // This would be implemented with specific endpoint logic
    return Promise.resolve();
  },

  /**
   * Warm cache with critical data
   */
  warmCache: async () => {
    console.log('🔥 Warming API cache...');
    // Prefetch commonly used data
    // This would be implemented based on app-specific needs
    return Promise.resolve();
  },

  /**
   * Monitor API health
   */
  healthCheck: async () => {
    try {
      const result = await baseQuery(
        '/health',
        { getState: () => ({}) } as any,
        {}
      );
      return {
        healthy: !result.error,
        timestamp: new Date().toISOString(),
        status: result.error?.status || 200,
      };
    } catch (error) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        error,
      };
    }
  },

  /**
   * Force refresh specific cache entries
   */
  forceRefresh: (tags: string[]) => {
    console.log('🔄 Force refreshing tags:', tags);
    return baseApi.util.invalidateTags(apiUtils.invalidate(tags));
  },
};

/**
 * Development utilities for API debugging
 */
if (config.environment === 'DEV') {
  // Add global API utilities for debugging
  (window as any).__API_UTILS__ = apiUtils;

  // Log API initialization
  console.log('🌐 Enhanced Base API initialized with:', {
    baseUrl: config.apiBaseUrl,
    timeout: config.apiTimeout,
    retryEnabled: true,
    authEnabled: true,
    refreshEnabled: true,
  });

  // Add API event listeners for debugging
  const apiEvents = ['api:forbidden', 'api:rateLimit', 'api:serverError'];
  apiEvents.forEach(event => {
    window.addEventListener(event, (e: any) => {
      console.group(`🎯 API Event: ${event}`);
      console.log('Details:', e.detail);
      console.groupEnd();
    });
  });
}

/**
 * Export the base API for extension by feature slices
 */
export default baseApi;
