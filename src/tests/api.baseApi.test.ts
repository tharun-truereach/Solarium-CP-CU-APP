/**
 * Comprehensive test suite for Base API RTK Query configuration
 * Tests authentication, error handling, retry logic, and token refresh
 */

import { configureAppStore } from '../store/store';
import { baseApi, apiUtils } from '../api/baseApi';
import { authSlice } from '../store/slices/authSlice';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock async-mutex
jest.mock('async-mutex', () => ({
  Mutex: jest.fn().mockImplementation(() => ({
    acquire: jest.fn().mockResolvedValue(() => {
      undefined;
    }),
  })),
}));

// Mock window location
const mockLocation = {
  href: '',
  assign: jest.fn(),
  replace: jest.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('Base API Configuration', () => {
  let store: ReturnType<typeof configureAppStore>;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    store = configureAppStore();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  describe('API Configuration', () => {
    it('should be configured with correct reducer path', () => {
      expect(baseApi.reducerPath).toBe('api');
    });

    it('should have correct cache configuration', () => {
      expect(() => {
        baseApi.util.resetApiState();
      }).not.toThrow();
    });

    it('should include all required tag types', () => {
      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testQuery: builder.query({
            query: () => '/test',
            providesTags: ['User', 'Auth', 'Lead'],
          }),
        }),
      });

      expect(testApi).toBeDefined();
    });
  });

  describe('Authentication Integration', () => {
    it('should include authorization header when token exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers(),
      } as Response);

      // Set up authenticated state
      store.dispatch(
        authSlice.actions.login({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
            permissions: [],
            isActive: true,
            isVerified: true,
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
          },
          token: 'test-token',
          expiresAt: '2023-12-31T23:59:59Z',
        })
      );

      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testEndpoint: builder.query<any, void>({
            query: () => '/test',
          }),
        }),
      });

      const promise = store.dispatch(testApi.endpoints.testEndpoint.initiate());
      await promise;

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should not include authorization header when no token exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers(),
      } as Response);

      expect(store.getState().auth.token).toBeNull();

      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testEndpoint: builder.query<any, void>({
            query: () => '/test',
          }),
        }),
      });

      const promise = store.dispatch(testApi.endpoints.testEndpoint.initiate());
      await promise;

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            authorization: expect.anything(),
          }),
        })
      );
    });

    it('should include client metadata headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers(),
      } as Response);

      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testEndpoint: builder.query<any, void>({
            query: () => '/test',
          }),
        }),
      });

      const promise = store.dispatch(testApi.endpoints.testEndpoint.initiate());
      await promise;

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-client-type': 'web-portal',
            'x-correlation-id': expect.any(String),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized with token refresh', async () => {
      // Mock 401 response, then successful refresh, then successful retry
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' }),
          headers: new Headers(),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            token: 'new-token',
            refreshToken: 'new-refresh-token',
            expiresAt: '2023-12-31T23:59:59Z',
          }),
          headers: new Headers(),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
          headers: new Headers(),
        } as Response);

      // Set up authenticated state with refresh token
      store.dispatch(
        authSlice.actions.login({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
            permissions: [],
            isActive: true,
            isVerified: true,
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
          },
          token: 'expired-token',
          refreshToken: 'refresh-token',
          expiresAt: '2023-01-01T00:00:00Z',
        })
      );

      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testEndpoint: builder.query<any, void>({
            query: () => '/test',
          }),
        }),
      });

      const promise = store.dispatch(testApi.endpoints.testEndpoint.initiate());
      const result = await promise;

      // Should have made 3 calls: original request, refresh, retry
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.isSuccess).toBe(true);

      // Token should be updated in store
      const newState = store.getState();
      expect(newState.auth.token).toBe('new-token');
    });

    it('should logout user when token refresh fails', async () => {
      // Mock 401 response followed by failed refresh
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' }),
          headers: new Headers(),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Invalid refresh token' }),
          headers: new Headers(),
        } as Response);

      store.dispatch(
        authSlice.actions.login({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
            permissions: [],
            isActive: true,
            isVerified: true,
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
          },
          token: 'expired-token',
          refreshToken: 'invalid-refresh-token',
          expiresAt: '2023-01-01T00:00:00Z',
        })
      );

      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testEndpoint: builder.query<any, void>({
            query: () => '/test',
          }),
        }),
      });

      const promise = store.dispatch(testApi.endpoints.testEndpoint.initiate());
      const result = await promise;

      expect(result.isError).toBe(true);

      // User should be logged out
      const newState = store.getState();
      expect(newState.auth.isAuthenticated).toBe(false);
      expect(newState.auth.token).toBeNull();

      // Should redirect to session expired page
      expect(mockLocation.href).toBe('/session-expired');
    });

    it('should handle 403 forbidden responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
        headers: new Headers(),
      } as Response);

      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testEndpoint: builder.query<any, void>({
            query: () => '/test',
          }),
        }),
      });

      const promise = store.dispatch(testApi.endpoints.testEndpoint.initiate());
      const result = await promise;

      expect(result.isError).toBe(true);
      expect(result.error).toEqual(
        expect.objectContaining({
          status: 403,
        })
      );

      // Should have dispatched custom event
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api:forbidden',
        })
      );

      // Should redirect to access denied page
      await new Promise(resolve => setTimeout(resolve, 150)); // Wait for timeout
      expect(mockLocation.href).toBe('/access-denied');

      dispatchEventSpy.mockRestore();
    });

    it('should handle 5xx server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
        headers: new Headers(),
      } as Response);

      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testEndpoint: builder.query<any, void>({
            query: () => '/test',
          }),
        }),
      });

      const promise = store.dispatch(testApi.endpoints.testEndpoint.initiate());
      const result = await promise;

      expect(result.isError).toBe(true);

      // Should have dispatched server error event
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api:serverError',
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should handle 429 rate limit responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Too Many Requests' }),
        headers: new Headers([['retry-after', '60']]),
      } as Response);

      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testEndpoint: builder.query<any, void>({
            query: () => '/test',
          }),
        }),
      });

      const promise = store.dispatch(testApi.endpoints.testEndpoint.initiate());
      const result = await promise;

      expect(result.isError).toBe(true);

      // Should have dispatched rate limit event
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api:rateLimit',
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should retry network errors with exponential backoff', async () => {
      // Mock network error followed by success
      mockFetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
          headers: new Headers(),
        } as Response);

      const testApi = baseApi.injectEndpoints({
        endpoints: builder => ({
          testEndpoint: builder.query<any, void>({
            query: () => '/test',
          }),
        }),
      });

      const promise = store.dispatch(testApi.endpoints.testEndpoint.initiate());
      const result = await promise;

      // Should have made 3 attempts
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('API Utilities', () => {
    it('should reset all API state', () => {
      expect(() => apiUtils.resetAll()).not.toThrow();
    });

    it('should provide cache statistics in development', () => {
      const stats = apiUtils.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('message');
      expect(stats).toHaveProperty('timestamp');
    });

    it('should create invalidation tags', () => {
      const tags = apiUtils.invalidate(['User', 'Lead']);
      expect(tags).toHaveLength(2);
      expect(tags[0]).toEqual({ type: 'User' });
      expect(tags[1]).toEqual({ type: 'Lead' });
    });

    it('should handle health check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
        headers: new Headers(),
      } as Response);

      const health = await apiUtils.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.status).toBe(200);
      expect(health.timestamp).toBeDefined();
    });

    it('should handle health check failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      const health = await apiUtils.healthCheck();
      expect(health.healthy).toBe(false);
      expect(health.error).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });
  });

  describe('Development Features', () => {
    it('should add global API utilities in development', () => {
      expect((window as any).__API_UTILS__).toBeDefined();
      expect((window as any).__API_UTILS__.resetAll).toBeDefined();
      expect((window as any).__API_UTILS__.getCacheStats).toBeDefined();
    });
  });
});
