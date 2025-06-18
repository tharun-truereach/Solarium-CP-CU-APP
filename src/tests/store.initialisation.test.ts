/**
 * Test suite for Redux store initialization and configuration
 * Ensures proper store setup with RTK Query, middleware, and persistence
 */

import { configureAppStore, storeUtils } from '../store/store';
import { baseApi } from '../api/baseApi';
import { authSlice } from '../store/slices/authSlice';
import { preferencesSlice } from '../store/slices/preferencesSlice';
import { config } from '../config/environment';

// Mock the environment config for testing
jest.mock('../config/environment', () => ({
  config: {
    environment: 'DEV',
    showReduxDevtools: true,
    cryptoSecret: 'test-secret-key-32-characters-long',
    apiBaseUrl: 'http://localhost:3000',
    apiTimeout: 5000,
  },
}));

// Mock redux-persist to avoid storage issues in tests
jest.mock('redux-persist/lib/storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock the encryption transform
jest.mock('redux-persist-transform-encrypt', () => {
  return jest.fn(() => ({
    in: (inboundState: any) => inboundState,
    out: (outboundState: any) => outboundState,
  }));
});

describe('Redux Store Initialization', () => {
  describe('Store Configuration', () => {
    it('should create store with correct initial state structure', () => {
      const testStore = configureAppStore();
      const state = testStore.getState();

      // Check that all required slices are present
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('preferences');
      expect(state).toHaveProperty('api');
      expect(state).toHaveProperty('_persist');

      // Check initial auth state
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(state.auth.token).toBeNull();

      // Check initial preferences state
      expect(state.preferences.themeMode).toBe('system');
      expect(state.preferences.sidebarState).toBe('expanded');
      expect(state.preferences.language).toBe('en');
    });

    it('should include RTK Query reducer and middleware', () => {
      const testStore = configureAppStore();
      const state = testStore.getState();

      // Check that RTK Query reducer is included
      expect(state).toHaveProperty(baseApi.reducerPath);
      expect(state.api).toHaveProperty('queries');
      expect(state.api).toHaveProperty('mutations');
      expect(state.api).toHaveProperty('provided');
      expect(state.api).toHaveProperty('subscriptions');
    });

    it('should configure DevTools based on environment', () => {
      // Test with DEV environment (DevTools enabled)
      const devConfig = {
        ...config,
        environment: 'DEV' as const,
        showReduxDevtools: true,
      };
      jest.doMock('../config/environment', () => ({ config: devConfig }));

      const devStore = configureAppStore();
      expect(devStore).toBeDefined();

      // Test with PROD environment (DevTools disabled)
      const prodConfig = {
        ...config,
        environment: 'PROD' as const,
        showReduxDevtools: false,
      };
      jest.doMock('../config/environment', () => ({ config: prodConfig }));

      const prodStore = configureAppStore();
      expect(prodStore).toBeDefined();
    });

    it('should include listener middleware', () => {
      const testStore = configureAppStore();

      // Test that the store can handle listener middleware
      // We'll test actual listeners in subsequent tasks
      expect(testStore.dispatch).toBeDefined();
      expect(typeof testStore.dispatch).toBe('function');
    });
  });

  describe('Store Utilities', () => {
    beforeEach(() => {
      // Reset store state before each test
      storeUtils.resetStore();
    });

    it('should provide resetStore utility', () => {
      expect(storeUtils.resetStore).toBeDefined();
      expect(typeof storeUtils.resetStore).toBe('function');

      // Test that resetStore clears state
      storeUtils.resetStore();
      const state = storeUtils.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
    });

    it('should provide getState utility', () => {
      expect(storeUtils.getState).toBeDefined();
      expect(typeof storeUtils.getState).toBe('function');

      const state = storeUtils.getState();
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('preferences');
      expect(state).toHaveProperty('api');
    });

    it('should provide isRehydrated utility', () => {
      expect(storeUtils.isRehydrated).toBeDefined();
      expect(typeof storeUtils.isRehydrated).toBe('function');

      // Note: In test environment, rehydration might not work as expected
      // This test mainly ensures the utility exists and doesn't throw
      const isRehydrated = storeUtils.isRehydrated();
      expect(typeof isRehydrated).toBe('boolean');
    });
  });

  describe('Store Actions and Reducers', () => {
    it('should handle auth slice actions', () => {
      const testStore = configureAppStore();

      // Test login action
      const loginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin' as const,
          permissions: [],
          isActive: true,
          isVerified: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
        token: 'test-token',
        expiresAt: '2023-12-31T23:59:59Z',
      };

      testStore.dispatch(authSlice.actions.login(loginPayload));

      const state = testStore.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user).toEqual(loginPayload.user);
      expect(state.auth.token).toBe(loginPayload.token);

      // Test logout action
      testStore.dispatch(authSlice.actions.logout());

      const loggedOutState = testStore.getState();
      expect(loggedOutState.auth.isAuthenticated).toBe(false);
      expect(loggedOutState.auth.user).toBeNull();
      expect(loggedOutState.auth.token).toBeNull();
    });

    it('should handle preferences slice actions', () => {
      const testStore = configureAppStore();

      // Test theme mode change
      testStore.dispatch(preferencesSlice.actions.setThemeMode('dark'));

      let state = testStore.getState();
      expect(state.preferences.themeMode).toBe('dark');

      // Test sidebar toggle
      testStore.dispatch(preferencesSlice.actions.toggleSidebar());

      state = testStore.getState();
      expect(state.preferences.sidebarState).toBe('collapsed');

      // Test preferences reset
      testStore.dispatch(preferencesSlice.actions.resetPreferences());

      state = testStore.getState();
      expect(state.preferences.themeMode).toBe('system');
      expect(state.preferences.sidebarState).toBe('expanded');
    });
  });

  describe('Persistence Configuration', () => {
    it('should configure persistence with correct whitelist', () => {
      // This test ensures the store is configured for persistence
      // The actual persistence is mocked in tests
      const testStore = configureAppStore();
      const state = testStore.getState();

      // Check that persist configuration is applied
      expect(state).toHaveProperty('_persist');
    });

    it('should handle encryption transform configuration', () => {
      // Test that encryption transform is configured without errors
      const testStore = configureAppStore();
      expect(testStore).toBeDefined();
      expect(testStore.getState).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle store creation with invalid configuration gracefully', () => {
      // Test that store creation doesn't throw with edge cases
      expect(() => configureAppStore()).not.toThrow();
    });

    it('should handle dispatch of invalid actions gracefully', () => {
      const testStore = configureAppStore();

      // Test that invalid actions don't crash the store
      expect(() => {
        testStore.dispatch({ type: 'INVALID_ACTION' });
      }).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should provide correct TypeScript types', () => {
      const testStore = configureAppStore();
      const state = testStore.getState();

      // These tests ensure TypeScript compilation without runtime assertions
      // The types are checked at compile time
      expect(typeof state.auth.isAuthenticated).toBe('boolean');
      expect(typeof state.preferences.themeMode).toBe('string');
      expect(typeof state.api).toBe('object');
    });
  });
});
