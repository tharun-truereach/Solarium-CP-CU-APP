/**
 * Comprehensive test suite for Enhanced Axios Client
 * Tests authentication, retry logic, error handling, and specialized operations
 */

import { AxiosError } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { configureAppStore } from '../store/store';
import { authSlice } from '../store/slices/authSlice';
import { axiosClient, httpClient } from '../services/http/axiosClient';

// Mock the store
const mockStore = {
  getState: jest.fn(),
  dispatch: jest.fn(),
};

jest.mock('../store/store', () => ({
  store: mockStore,
}));

// Mock the config
jest.mock('../config/environment', () => ({
  config: {
    apiBaseUrl: 'http://localhost:3001/api',
    apiTimeout: 5000,
    environment: 'DEV',
    version: '1.0.0-test',
  },
}));

describe('Enhanced Axios Client', () => {
  let mock: MockAdapter;
  let store: ReturnType<typeof configureAppStore>;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mock = new MockAdapter(axiosClient);
    store = configureAppStore();
    mockDispatch = jest.fn();

    // Mock store
    mockStore.getState.mockReturnValue(store.getState());
    mockStore.dispatch.mockImplementation(mockDispatch);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Request Interceptors', () => {
    it('should add authorization header when token exists', async () => {
      // Setup authenticated state
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
          token: 'test-jwt-token',
          expiresAt: '2023-12-31T23:59:59Z',
        })
      );

      // Mock API response
      mock.onGet('/test').reply(200, { success: true });

      // Make request
      await httpClient.get('/test');

      // Verify request was made with authorization header
      expect(mock.history.get[0]!.headers?.Authorization).toBe(
        'Bearer test-jwt-token'
      );
    });

    it('should not add authorization header when token does not exist', async () => {
      // Ensure no token in state
      expect(store.getState().auth.token).toBeNull();

      // Mock API response
      mock.onGet('/test').reply(200, { success: true });

      // Make request
      await httpClient.get('/test');

      // Verify request was made without authorization header
      expect(mock.history.get[0]!.headers?.Authorization).toBeUndefined();
    });

    it('should skip auth when _skipAuth is true', async () => {
      // Setup authenticated state
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
          token: 'test-jwt-token',
          expiresAt: '2023-12-31T23:59:59Z',
        })
      );

      // Mock API response
      mock.onGet('/test').reply(200, { success: true });

      // Make request with skipAuth
      await httpClient.get('/test', { _skipAuth: true });

      // Verify request was made without authorization header
      expect(mock.history.get[0]!.headers?.Authorization).toBeUndefined();
    });

    it('should add correlation ID and client metadata', async () => {
      mock.onGet('/test').reply(200, { success: true });

      await httpClient.get('/test');

      const request = mock.history.get[0];
      expect(request?.headers?.['X-Correlation-ID']).toMatch(
        /^axios-\d+-[a-z0-9]+$/
      );
      expect(request?.headers?.['X-Client-Type']).toBe('web-portal');
      expect(request?.headers?.['X-Client-Version']).toBe('1.0.0-test');
    });
  });

  describe('Response Interceptors', () => {
    it('should handle 401 unauthorized responses', async () => {
      // Setup authenticated state
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
          expiresAt: '2023-01-01T00:00:00Z',
        })
      );

      // Mock 401 response
      mock.onGet('/test').reply(401, { message: 'Unauthorized' });

      // Mock window.location
      delete (window as any).location;
      (window as any).location = { href: '' };

      try {
        await httpClient.get('/test');
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as AxiosError).response?.status).toBe(401);
      }

      // Should have dispatched logout actions
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth/sessionExpired' })
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth/logout' })
      );

      // Should have redirected to session expired page
      expect(window.location.href).toBe('/session-expired');
    });

    it('should handle 403 forbidden responses', async () => {
      mock.onGet('/test').reply(403, { message: 'Forbidden' });

      // Mock window.location and dispatchEvent
      delete (window as any).location;
      (window as any).location = { href: '' };
      const mockDispatchEvent = jest.fn();
      window.dispatchEvent = mockDispatchEvent;

      try {
        await httpClient.get('/test');
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as AxiosError).response?.status).toBe(403);
      }

      // Should have dispatched custom event
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'axios:forbidden',
        })
      );

      // Should redirect to access denied page (after timeout)
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(window.location.href).toBe('/access-denied');
    });

    it('should handle network errors', async () => {
      mock.onGet('/test').networkError();

      const mockDispatchEvent = jest.fn();
      window.dispatchEvent = mockDispatchEvent;

      try {
        await httpClient.get('/test');
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as AxiosError).code).toBe('ERR_NETWORK');
      }

      // Should have dispatched network error event
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'axios:networkError',
        })
      );
    });

    it('should handle 5xx server errors', async () => {
      mock.onGet('/test').reply(500, { message: 'Internal Server Error' });

      const mockDispatchEvent = jest.fn();
      window.dispatchEvent = mockDispatchEvent;

      try {
        await httpClient.get('/test');
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as AxiosError).response?.status).toBe(500);
      }

      // Should have dispatched server error event
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'axios:serverError',
        })
      );
    });
  });

  describe('HTTP Client Methods', () => {
    it('should handle GET requests', async () => {
      const responseData = { id: 1, name: 'Test' };
      mock.onGet('/users/1').reply(200, responseData);

      const result = await httpClient.get('/users/1');

      expect(result).toEqual(responseData);
      expect(mock.history.get).toHaveLength(1);
    });

    it('should handle POST requests', async () => {
      const requestData = { name: 'New User', email: 'new@example.com' };
      const responseData = { id: 2, ...requestData };

      mock.onPost('/users').reply(201, responseData);

      const result = await httpClient.post('/users', requestData);

      expect(result).toEqual(responseData);
      expect(mock.history.post).toHaveLength(1);
      expect(JSON.parse(mock.history.post[0]!.data)).toEqual(requestData);
    });

    it('should handle PUT requests', async () => {
      const requestData = { name: 'Updated User' };
      const responseData = {
        id: 1,
        name: 'Updated User',
        email: 'user@example.com',
      };

      mock.onPut('/users/1').reply(200, responseData);

      const result = await httpClient.put('/users/1', requestData);

      expect(result).toEqual(responseData);
      expect(mock.history.put).toHaveLength(1);
    });

    it('should handle PATCH requests', async () => {
      const requestData = { name: 'Patched User' };
      const responseData = {
        id: 1,
        name: 'Patched User',
        email: 'user@example.com',
      };

      mock.onPatch('/users/1').reply(200, responseData);

      const result = await httpClient.patch('/users/1', requestData);

      expect(result).toEqual(responseData);
      expect(mock.history.patch).toHaveLength(1);
    });

    it('should handle DELETE requests', async () => {
      mock.onDelete('/users/1').reply(204);

      const result = await httpClient.delete('/users/1');

      expect(result).toEqual({});
      expect(mock.history.delete).toHaveLength(1);
    });
  });

  describe('File Operations', () => {
    it('should handle file uploads with progress', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const responseData = { id: 1, filename: 'test.txt', size: 12 };

      mock.onPost('/upload').reply(200, responseData);

      const progressCallback = jest.fn();

      const result = await httpClient.uploadFile('/upload', file, {
        onProgress: progressCallback,
        metadata: { component: 'FileUpload' },
      });

      expect(result).toEqual(responseData);
      expect(mock.history.post).toHaveLength(1);

      // Verify FormData was sent
      expect(mock.history.post[0]!.data).toBeInstanceOf(FormData);
    });

    it('should handle file downloads', async () => {
      const blob = new Blob(['file content'], { type: 'text/plain' });
      mock.onGet('/download/test.txt').reply(200, blob);

      // Mock DOM elements
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const mockCreateElement = jest.fn().mockReturnValue(mockLink);
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob:url');
      const mockRevokeObjectURL = jest.fn();

      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
      });
      Object.defineProperty(window.URL, 'createObjectURL', {
        value: mockCreateObjectURL,
      });
      Object.defineProperty(window.URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
      });

      await httpClient.downloadFile('/download/test.txt', {
        filename: 'downloaded-file.txt',
      });

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('downloaded-file.txt');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch requests', async () => {
      mock.onGet('/users/1').reply(200, { id: 1, name: 'User 1' });
      mock.onGet('/users/2').reply(200, { id: 2, name: 'User 2' });
      mock.onPost('/users').reply(201, { id: 3, name: 'New User' });

      const requests = [
        { method: 'GET' as const, url: '/users/1' },
        { method: 'GET' as const, url: '/users/2' },
        { method: 'POST' as const, url: '/users', data: { name: 'New User' } },
      ];

      const results = await httpClient.batch(requests);

      expect(results).toHaveLength(3);
      expect(results[0]!.success).toBe(true);
      expect(results[0]!.data).toEqual({ id: 1, name: 'User 1' });
      expect(results[1]!.success).toBe(true);
      expect(results[1]!.data).toEqual({ id: 2, name: 'User 2' });
      expect(results[2]!.success).toBe(true);
      expect(results[2]!.data).toEqual({ id: 3, name: 'New User' });
    });

    it('should handle batch requests with failures', async () => {
      mock.onGet('/users/1').reply(200, { id: 1, name: 'User 1' });
      mock.onGet('/users/404').reply(404, { message: 'Not Found' });

      const requests = [
        { method: 'GET' as const, url: '/users/1' },
        { method: 'GET' as const, url: '/users/404' },
      ];

      const results = await httpClient.batch(requests);

      expect(results).toHaveLength(2);
      expect(results[0]!.success).toBe(true);
      expect(results[1]!.success).toBe(false);
      expect(results[1]!.error).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      mock.onGet('/health').reply(200, { status: 'healthy' });

      const result = await httpClient.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should handle health check failure', async () => {
      mock.onGet('/health').reply(500, { status: 'unhealthy' });

      const result = await httpClient.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.timestamp).toBeDefined();
      expect(result.error).toBeDefined();
    });
  });

  describe('Data Transformation', () => {
    it('should handle FormData requests', async () => {
      const formData = new FormData();
      formData.append('key', 'value');

      mock.onPost('/form').reply(200, { success: true });

      await httpClient.post('/form', formData);

      expect(mock.history.post).toHaveLength(1);
      expect(mock.history.post[0]!.data).toBeInstanceOf(FormData);
      expect(mock.history.post[0]!.headers?.['Content-Type']).toBeUndefined(); // Should be removed for FormData
    });

    it('should handle URLSearchParams requests', async () => {
      const params = new URLSearchParams();
      params.append('key', 'value');

      mock.onPost('/form').reply(200, { success: true });

      await httpClient.post('/form', params);

      expect(mock.history.post).toHaveLength(1);
      expect(mock.history.post[0]!.data).toBe('key=value');
      expect(mock.history.post[0]!.headers?.['Content-Type']).toBe(
        'application/x-www-form-urlencoded'
      );
    });

    it('should handle JSON requests', async () => {
      const data = { key: 'value', number: 42 };

      mock.onPost('/json').reply(200, { success: true });

      await httpClient.post('/json', data);

      expect(mock.history.post).toHaveLength(1);
      expect(JSON.parse(mock.history.post[0]!.data)).toEqual(data);
      expect(mock.history.post[0]!.headers?.['Content-Type']).toBe(
        'application/json'
      );
    });
  });

  describe('Metadata and Debugging', () => {
    it('should include metadata in requests', async () => {
      mock.onGet('/test').reply(200, { success: true });

      await httpClient.get('/test', {
        metadata: {
          operation: 'TEST_OPERATION',
          component: 'TestComponent',
          userFacing: true,
        },
      });

      // Metadata is added to the config but not sent as headers
      expect(mock.history.get).toHaveLength(1);
    });

    it('should update user activity for authenticated requests', async () => {
      // Setup authenticated state
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

      mock.onGet('/test').reply(200, { success: true });

      await httpClient.get('/test');

      // Should have dispatched updateActivity action
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth/updateActivity' })
      );
    });
  });
});
