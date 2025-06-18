/**
 * HTTP Client initialization and management hook
 * Sets up HTTP client integration with Redux store and provides utilities
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectToken, selectIsAuthenticated } from '../store/slices/authSlice';
import { config } from '../config/environment';

/**
 * HTTP client state interface
 */
interface HttpClientState {
  isInitialized: boolean;
  hasToken: boolean;
  baseUrl: string;
  timeout: number;
}

/**
 * Hook to initialize and manage HTTP client with Redux integration
 */
export const useHttpClient = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  /**
   * Get current HTTP client state
   */
  const getHttpClientState = useCallback((): HttpClientState => {
    return {
      isInitialized: true,
      hasToken: !!token,
      baseUrl: config.apiBaseUrl,
      timeout: config.apiTimeout,
    };
  }, [token]);

  /**
   * Setup HTTP client and event listeners
   */
  useEffect(() => {
    if (config.environment === 'DEV') {
      console.log('🌐 HTTP Client hook initialized:', {
        hasToken: !!token,
        isAuthenticated,
        baseUrl: config.apiBaseUrl,
      });
    }

    // Setup global error event listeners
    const handleForbiddenError = (event: CustomEvent) => {
      console.warn('🚫 Global forbidden error handler:', event.detail);
    };

    const handleNetworkError = (event: CustomEvent) => {
      console.error('🌐 Global network error handler:', event.detail);
    };

    const handleRateLimit = (event: CustomEvent) => {
      console.warn('⏳ Global rate limit handler:', event.detail);
    };

    const handleServerError = (event: CustomEvent) => {
      console.error('🚨 Global server error handler:', event.detail);
    };

    // Add event listeners for both API and Axios events
    const events = [
      { name: 'api:forbidden', handler: handleForbiddenError },
      { name: 'api:rateLimit', handler: handleRateLimit },
      { name: 'api:serverError', handler: handleServerError },
      { name: 'axios:forbidden', handler: handleForbiddenError },
      { name: 'axios:networkError', handler: handleNetworkError },
    ];

    events.forEach(({ name, handler }) => {
      window.addEventListener(name, handler as EventListener);
    });

    // Cleanup
    return () => {
      events.forEach(({ name, handler }) => {
        window.removeEventListener(name, handler as EventListener);
      });
    };
  }, [dispatch, token, isAuthenticated]);

  /**
   * Get HTTP client debug information
   */
  const getDebugInfo = useCallback(() => {
    if (config.environment !== 'DEV') {
      return null;
    }

    return {
      state: getHttpClientState(),
      environment: config.environment,
      baseUrl: config.apiBaseUrl,
      timeout: config.apiTimeout,
      hasToken: !!token,
      isAuthenticated,
    };
  }, [getHttpClientState, token, isAuthenticated]);

  return {
    // State
    httpClientState: getHttpClientState(),

    // Utilities
    getDebugInfo,
    isReady: true,
    hasAuthToken: !!token,
  };
};

/**
 * Export HTTP client state type for external usage
 */
export type { HttpClientState };
