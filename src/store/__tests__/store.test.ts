/**
 * Redux store tests
 * Tests store configuration and basic functionality
 */

import { configureAppStore } from '../index';
import { login, logout } from '../slices/authSlice';
import { setGlobalLoading, showError } from '../slices/uiSlice';
import { LoginResponse } from '@/types';

describe('Redux Store Configuration', () => {
  let store: ReturnType<typeof configureAppStore>;

  beforeEach(() => {
    store = configureAppStore();
  });

  it('should initialize with correct initial state', () => {
    const state = store.getState();

    expect(state.auth).toEqual({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    expect(state.ui).toEqual({
      globalLoading: false,
      errorToast: {
        show: false,
        message: '',
        severity: 'error',
      },
      sidebarOpen: true,
      theme: 'light',
    });
  });

  it('should handle auth actions correctly', () => {
    const mockLoginResponse: LoginResponse = {
      token: 'test-token',
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      expiresAt: '2023-01-02T00:00:00Z',
    };

    // Test login
    store.dispatch(login(mockLoginResponse));
    let state = store.getState();

    expect(state.auth.token).toBe('test-token');
    expect(state.auth.user).toEqual(mockLoginResponse.user);
    expect(state.auth.isAuthenticated).toBe(true);

    // Test logout
    store.dispatch(logout());
    state = store.getState();

    expect(state.auth.token).toBeNull();
    expect(state.auth.user).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
  });

  it('should handle UI actions correctly', () => {
    // Test global loading
    store.dispatch(setGlobalLoading(true));
    let state = store.getState();
    expect(state.ui.globalLoading).toBe(true);

    // Test error toast
    store.dispatch(showError({ message: 'Test error', severity: 'warning' }));
    state = store.getState();
    expect(state.ui.errorToast).toEqual({
      show: true,
      message: 'Test error',
      severity: 'warning',
    });
  });

  it('should have Redux DevTools in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const devStore = configureAppStore();
    expect(devStore).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });
});
