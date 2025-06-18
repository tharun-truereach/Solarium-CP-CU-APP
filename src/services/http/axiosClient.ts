/**
 * Enhanced Axios HTTP client for Solarium Web Portal
 * Provides comprehensive HTTP access with authentication, retry logic, and error handling
 * Integrates with Redux store and complements RTK Query for specialized operations
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { config } from '../../config/environment';
import { store } from '../../store/store';
import {
  logout,
  sessionExpired,
  updateActivity,
} from '../../store/slices/authSlice';
import { setupRetry } from './retryInterceptor';
import { withCircuitBreaker } from './circuitBreaker';

/**
 * Request configuration with retry metadata
 */
interface EnhancedAxiosRequestConfig extends AxiosRequestConfig {
  _retryCount?: number;
  _skipAuth?: boolean;
  _skipRetry?: boolean;
  _skipCircuitBreaker?: boolean;
  metadata?: {
    operation?: string;
    component?: string;
    userFacing?: boolean;
  };
}

/**
 * Create enhanced axios instance with comprehensive configuration
 */
const createEnhancedAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.apiTimeout,

    // Default headers
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Client-Type': 'web-portal',
      'X-Client-Version': config.version,
    },

    // Request/response interceptors will be added separately
    validateStatus: status => status >= 200 && status < 300,

    // Transform request data
    transformRequest: [
      (data, headers) => {
        // Add correlation ID for request tracing
        const correlationId = `axios-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (headers) {
          headers['X-Correlation-ID'] = correlationId;

          // Add environment info for debugging (only in non-production)
          if (config.environment !== 'PROD') {
            headers['X-Environment'] = config.environment;
          }
        }

        // Handle different data types
        if (data instanceof FormData) {
          // For file uploads, don't stringify FormData and let browser set Content-Type
          if (headers) delete headers['Content-Type'];
          return data;
        }

        if (data instanceof URLSearchParams) {
          // For form data, set appropriate content type
          if (headers)
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
          return data.toString();
        }

        if (typeof data === 'object' && data !== null) {
          return JSON.stringify(data);
        }

        return data;
      },
    ],

    // Transform response data
    transformResponse: [
      data => {
        // Handle empty responses
        if (!data || data === '') {
          return {};
        }

        // Handle blob responses (file downloads)
        if (data instanceof Blob) {
          return data;
        }

        // Try to parse JSON
        try {
          return JSON.parse(data);
        } catch (error) {
          // Return as-is if not JSON (could be plain text, HTML, etc.)
          return data;
        }
      },
    ],
  });

  return instance;
};

/**
 * Main enhanced axios client instance
 */
export const axiosClient: AxiosInstance = createEnhancedAxiosInstance();

/**
 * Request interceptor for authentication, logging, and metadata
 */
axiosClient.interceptors.request.use(
  (axiosConfig: InternalAxiosRequestConfig) => {
    const enhancedConfig = axiosConfig as EnhancedAxiosRequestConfig;

    // Get current auth token from Redux store (unless explicitly skipped)
    if (!enhancedConfig._skipAuth) {
      const state = store.getState();
      const token = state.auth.token;

      if (token && axiosConfig.headers) {
        axiosConfig.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Update user activity for authenticated requests
    const state = store.getState();
    if (state.auth.isAuthenticated && !enhancedConfig._skipAuth) {
      store.dispatch(updateActivity());
    }

    // Log request in development
    if (config.environment === 'DEV') {
      console.log(
        `🌐 Axios Request: ${axiosConfig.method?.toUpperCase()} ${axiosConfig.url}`,
        {
          headers: axiosConfig.headers,
          data:
            axiosConfig.data instanceof FormData
              ? 'FormData'
              : axiosConfig.data instanceof URLSearchParams
                ? 'URLSearchParams'
                : axiosConfig.data,
          metadata: enhancedConfig.metadata,
        }
      );
    }

    return axiosConfig;
  },
  (error: AxiosError) => {
    console.error('🚨 Axios Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling, authentication, and logging
 */
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response in development
    if (config.environment === 'DEV') {
      console.log(
        `✅ Axios Response: ${response.status} ${response.config.url}`,
        {
          status: response.status,
          statusText: response.statusText,
          data: response.data instanceof Blob ? 'Blob' : response.data,
          headers: response.headers,
        }
      );
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as EnhancedAxiosRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - automatic logout
    if (error.response?.status === 401 && !originalRequest._skipAuth) {
      console.log('🔐 Axios: 401 Unauthorized - dispatching logout');

      // Dispatch logout action
      store.dispatch(sessionExpired());
      store.dispatch(logout());

      // Redirect to session expired page
      if (typeof window !== 'undefined') {
        window.location.href = '/session-expired';
      }

      return Promise.reject(error);
    }

    // Handle 403 Forbidden - access denied
    if (error.response?.status === 403) {
      console.warn('🚫 Axios: 403 Forbidden - insufficient permissions');

      // Dispatch custom event for global handling
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('axios:forbidden', {
            detail: {
              url: originalRequest.url,
              method: originalRequest.method,
              error: error.response.data,
            },
          })
        );

        // Redirect to access denied page
        setTimeout(() => {
          window.location.href = '/access-denied';
        }, 100);
      }

      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests - rate limiting
    if (error.response?.status === 429) {
      console.warn('⏳ Axios: 429 Too Many Requests - rate limited');

      // Dispatch custom event for rate limiting handling
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('axios:rateLimit', {
            detail: {
              url: originalRequest.url,
              retryAfter: error.response.headers['retry-after'],
              error: error.response.data,
            },
          })
        );
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('🌐 Axios: Network Error', error.message);

      // Dispatch custom event for network error handling
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('axios:networkError', {
            detail: {
              url: originalRequest.url,
              method: originalRequest.method,
              message: error.message,
            },
          })
        );
      }
    }

    // Handle 5xx server errors
    if (error.response && error.response.status >= 500) {
      console.error('🚨 Axios: Server Error', error.response.status);

      // Dispatch custom event for server error handling
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('axios:serverError', {
            detail: {
              url: originalRequest.url,
              status: error.response.status,
              error: error.response.data,
            },
          })
        );
      }
    }

    // Log error details in development
    if (config.environment === 'DEV') {
      console.group('🚨 Axios Error Details');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('URL:', originalRequest.url);
      console.error('Method:', originalRequest.method);
      console.error('Request Data:', originalRequest.data);
      console.error('Response Data:', error.response?.data);
      console.error('Headers:', error.response?.headers);
      console.error('Config:', originalRequest);
      console.groupEnd();
    }

    return Promise.reject(error);
  }
);

/**
 * Setup retry logic for the axios instance
 */
setupRetry(axiosClient, {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    const config = error.config as EnhancedAxiosRequestConfig;

    // Skip retry if explicitly disabled
    if (config?._skipRetry) {
      return false;
    }

    // Don't retry authentication errors or client errors
    if (
      error.response?.status &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      return false;
    }

    // Retry on network errors, timeouts, and server errors
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      error.response.status >= 500 // Server error
    );
  },
});

/**
 * Enhanced HTTP client methods with comprehensive error handling
 */
export const httpClient = {
  /**
   * GET request with enhanced options
   */
  get: <T = any>(
    url: string,
    config?: EnhancedAxiosRequestConfig
  ): Promise<T> => {
    const enhancedConfig = {
      ...config,
      metadata: { operation: 'GET', ...config?.metadata },
    };

    return axiosClient
      .get<T>(url, enhancedConfig)
      .then(response => response.data);
  },

  /**
   * POST request with enhanced options
   */
  post: <T = any>(
    url: string,
    data?: any,
    config?: EnhancedAxiosRequestConfig
  ): Promise<T> => {
    const enhancedConfig = {
      ...config,
      metadata: { operation: 'POST', ...config?.metadata },
    };

    return axiosClient
      .post<T>(url, data, enhancedConfig)
      .then(response => response.data);
  },

  /**
   * PUT request with enhanced options
   */
  put: <T = any>(
    url: string,
    data?: any,
    config?: EnhancedAxiosRequestConfig
  ): Promise<T> => {
    const enhancedConfig = {
      ...config,
      metadata: { operation: 'PUT', ...config?.metadata },
    };

    return axiosClient
      .put<T>(url, data, enhancedConfig)
      .then(response => response.data);
  },

  /**
   * PATCH request with enhanced options
   */
  patch: <T = any>(
    url: string,
    data?: any,
    config?: EnhancedAxiosRequestConfig
  ): Promise<T> => {
    const enhancedConfig = {
      ...config,
      metadata: { operation: 'PATCH', ...config?.metadata },
    };

    return axiosClient
      .patch<T>(url, data, enhancedConfig)
      .then(response => response.data);
  },

  /**
   * DELETE request with enhanced options
   */
  delete: <T = any>(
    url: string,
    config?: EnhancedAxiosRequestConfig
  ): Promise<T> => {
    const enhancedConfig = {
      ...config,
      metadata: { operation: 'DELETE', ...config?.metadata },
    };

    return axiosClient
      .delete<T>(url, enhancedConfig)
      .then(response => response.data);
  },

  /**
   * File upload with progress tracking and enhanced error handling
   */
  uploadFile: <T = any>(
    url: string,
    file: File | FormData,
    options: {
      onProgress?: (progress: number) => void;
      onError?: (error: AxiosError) => void;
      metadata?: any;
      config?: EnhancedAxiosRequestConfig;
    } = {}
  ): Promise<T> => {
    const { onProgress, onError, metadata, config: additionalConfig } = options;

    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    const config: EnhancedAxiosRequestConfig = {
      ...additionalConfig,
      headers: {
        ...additionalConfig?.headers,
        'Content-Type': 'multipart/form-data',
      },
      metadata: {
        operation: 'FILE_UPLOAD',
        userFacing: true,
        ...metadata,
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    };

    return axiosClient
      .post<T>(url, formData, config)
      .then(response => response.data)
      .catch(error => {
        if (onError) {
          onError(error);
        }
        throw error;
      });
  },

  /**
   * File download with progress tracking
   */
  downloadFile: (
    url: string,
    options: {
      filename?: string;
      onProgress?: (progress: number) => void;
      onError?: (error: AxiosError) => void;
      metadata?: any;
      config?: EnhancedAxiosRequestConfig;
    } = {}
  ): Promise<void> => {
    const {
      filename,
      onProgress,
      onError,
      metadata,
      config: additionalConfig,
    } = options;

    const config: EnhancedAxiosRequestConfig = {
      ...additionalConfig,
      responseType: 'blob',
      metadata: {
        operation: 'FILE_DOWNLOAD',
        userFacing: true,
        ...metadata,
      },
      onDownloadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    };

    return axiosClient
      .get(url, config)
      .then(response => {
        // Create download link
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch(error => {
        if (onError) {
          onError(error);
        }
        throw error;
      });
  },

  /**
   * Batch requests with enhanced error handling
   */
  batch: async <T = any>(
    requests: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      url: string;
      data?: any;
      config?: EnhancedAxiosRequestConfig;
    }>
  ): Promise<Array<{ success: boolean; data?: T; error?: AxiosError }>> => {
    const promises = requests.map(async request => {
      try {
        const config = {
          ...request.config,
          metadata: {
            operation: 'BATCH_REQUEST',
            ...request.config?.metadata,
          },
        };

        let response: AxiosResponse<T>;

        switch (request.method) {
          case 'GET':
            response = await axiosClient.get(request.url, config);
            break;
          case 'POST':
            response = await axiosClient.post(
              request.url,
              request.data,
              config
            );
            break;
          case 'PUT':
            response = await axiosClient.put(request.url, request.data, config);
            break;
          case 'PATCH':
            response = await axiosClient.patch(
              request.url,
              request.data,
              config
            );
            break;
          case 'DELETE':
            response = await axiosClient.delete(request.url, config);
            break;
        }

        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error as AxiosError };
      }
    });

    return Promise.all(promises);
  },

  /**
   * Health check utility
   */
  healthCheck: async (): Promise<{
    healthy: boolean;
    timestamp: string;
    responseTime?: number;
    error?: string;
  }> => {
    const startTime = Date.now();

    try {
      await axiosClient.get('/health', {
        _skipAuth: true,
        _skipRetry: true,
        timeout: 5000,
        metadata: { operation: 'HEALTH_CHECK' },
      } as EnhancedAxiosRequestConfig);

      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        timestamp: new Date().toISOString(),
        responseTime,
      };
    } catch (error) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

/**
 * Circuit breaker integration (optional)
 */
export const circuitBreakerClient = {
  get: <T = any>(url: string, config?: EnhancedAxiosRequestConfig) =>
    withCircuitBreaker(`GET:${url}`, () => httpClient.get<T>(url, config)),

  post: <T = any>(
    url: string,
    data?: any,
    config?: EnhancedAxiosRequestConfig
  ) =>
    withCircuitBreaker(`POST:${url}`, () =>
      httpClient.post<T>(url, data, config)
    ),

  put: <T = any>(
    url: string,
    data?: any,
    config?: EnhancedAxiosRequestConfig
  ) =>
    withCircuitBreaker(`PUT:${url}`, () =>
      httpClient.put<T>(url, data, config)
    ),

  patch: <T = any>(
    url: string,
    data?: any,
    config?: EnhancedAxiosRequestConfig
  ) =>
    withCircuitBreaker(`PATCH:${url}`, () =>
      httpClient.patch<T>(url, data, config)
    ),

  delete: <T = any>(url: string, config?: EnhancedAxiosRequestConfig) =>
    withCircuitBreaker(`DELETE:${url}`, () =>
      httpClient.delete<T>(url, config)
    ),
};

/**
 * Development utilities
 */
if (config.environment === 'DEV') {
  // Add global HTTP client utilities for debugging
  (window as any).__HTTP_CLIENT__ = {
    client: httpClient,
    axiosInstance: axiosClient,
    circuitBreaker: circuitBreakerClient,
    healthCheck: httpClient.healthCheck,
  };

  console.log('🌐 Enhanced Axios Client initialized with:', {
    baseURL: config.apiBaseUrl,
    timeout: config.apiTimeout,
    retryEnabled: true,
    circuitBreakerAvailable: true,
    authenticationEnabled: true,
  });
}

/**
 * Export the enhanced axios instance for direct usage
 */
export default axiosClient;
