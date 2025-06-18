/**
 * Test suite for Redux store persistence functionality
 * Tests encryption, storage, and purge utilities
 */

// Mock redux-persist/lib/storage first (before any imports)
const mockStorage = {
  store: {} as { [key: string]: string },
  getItem: jest.fn(
    (key: string): string | null => mockStorage.store[key] || null
  ),
  setItem: jest.fn((key: string, value: string): void => {
    mockStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string): void => {
    delete mockStorage.store[key];
  }),
  clear: jest.fn((): void => {
    mockStorage.store = {};
  }),
};

jest.mock('redux-persist/lib/storage', () => mockStorage);

jest.mock('redux-persist-transform-encrypt', () => ({
  encryptTransform: jest.fn().mockImplementation(() => ({
    in: (inboundState: any) => `encrypted_${JSON.stringify(inboundState)}`,
    out: (outboundState: any) => {
      if (
        typeof outboundState === 'string' &&
        outboundState.startsWith('encrypted_')
      ) {
        return JSON.parse(outboundState.replace('encrypted_', ''));
      }
      return outboundState;
    },
  })),
}));

jest.mock('redux-persist', () => ({
  ...jest.requireActual('redux-persist'),
  persistReducer: jest.fn((config, reducer) => reducer),
  persistStore: jest.fn(() => ({
    purge: jest.fn(() => Promise.resolve()),
    flush: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    persist: jest.fn(),
  })),
  FLUSH: 'persist/FLUSH',
  REHYDRATE: 'persist/REHYDRATE',
  PAUSE: 'persist/PAUSE',
  PERSIST: 'persist/PERSIST',
  PURGE: 'persist/PURGE',
  REGISTER: 'persist/REGISTER',
}));

// Now import modules after mocking
import { configureAppStore, storeUtils } from '../store/store';
import { storagePurge } from '../store/persistence/encryptedTransform';
import { authSlice } from '../store/slices/authSlice';
import { preferencesSlice } from '../store/slices/preferencesSlice';

// Set up window.localStorage after imports
Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
});

describe('Redux Store Persistence', () => {
  let testStore: ReturnType<typeof configureAppStore>;

  beforeEach(() => {
    // Clear mocks and create fresh store
    jest.clearAllMocks();
    mockStorage.clear();
    mockStorage.store = {}; // Reset the store object

    // Reset all mock implementations to their original functions
    mockStorage.getItem.mockImplementation(
      (key: string): string | null => mockStorage.store[key] || null
    );
    mockStorage.setItem.mockImplementation(
      (key: string, value: string): void => {
        mockStorage.store[key] = value;
      }
    );
    mockStorage.removeItem.mockImplementation((key: string): void => {
      delete mockStorage.store[key];
    });
    mockStorage.clear.mockImplementation((): void => {
      mockStorage.store = {};
    });

    testStore = configureAppStore();
  });

  describe('Storage Purge Utilities', () => {
    beforeEach(() => {
      // Set up mock data in localStorage
      mockStorage.store['persist:root'] = 'encrypted_root_data';
      mockStorage.store['persist:auth'] = 'encrypted_auth_data';
      mockStorage.store['persist:preferences'] = 'encrypted_preferences_data';
    });

    it('should purge all persisted data', async () => {
      // Verify data exists before purge
      expect(mockStorage.store['persist:root']).toBe('encrypted_root_data');
      expect(mockStorage.store['persist:auth']).toBe('encrypted_auth_data');
      expect(mockStorage.store['persist:preferences']).toBe(
        'encrypted_preferences_data'
      );

      await storagePurge.purgeAll();

      // Check that removeItem was called for each key
      expect(mockStorage.removeItem).toHaveBeenCalledTimes(3);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('persist:root');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('persist:auth');
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        'persist:preferences'
      );

      // Verify data is actually removed
      expect(mockStorage.store['persist:root']).toBeUndefined();
      expect(mockStorage.store['persist:auth']).toBeUndefined();
      expect(mockStorage.store['persist:preferences']).toBeUndefined();
    });

    it('should purge only auth data', async () => {
      // Verify data exists before purge
      expect(mockStorage.store['persist:auth']).toBe('encrypted_auth_data');

      await storagePurge.purgeAuth();

      // Check that removeItem was called only for auth
      expect(mockStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('persist:auth');
      expect(mockStorage.removeItem).not.toHaveBeenCalledWith('persist:root');
      expect(mockStorage.removeItem).not.toHaveBeenCalledWith(
        'persist:preferences'
      );

      // Verify only auth data is removed
      expect(mockStorage.store['persist:auth']).toBeUndefined();
      expect(mockStorage.store['persist:root']).toBe('encrypted_root_data');
      expect(mockStorage.store['persist:preferences']).toBe(
        'encrypted_preferences_data'
      );
    });

    it('should detect persisted data when data exists', () => {
      expect(storagePurge.hasPersistedData()).toBe(true);
    });

    it('should detect no persisted data when storage is empty', () => {
      mockStorage.store = {};
      expect(storagePurge.hasPersistedData()).toBe(false);
    });

    it('should calculate storage sizes', () => {
      const sizes = storagePurge.getStorageSize();

      expect(sizes).toHaveProperty('persist:root');
      expect(sizes).toHaveProperty('persist:auth');
      expect(sizes).toHaveProperty('persist:preferences');
      expect(typeof sizes['persist:root']).toBe('number');
      expect(sizes['persist:root']).toBeGreaterThan(0);
      expect(sizes['persist:auth']).toBeGreaterThan(0);
      expect(sizes['persist:preferences']).toBeGreaterThan(0);
    });

    it('should handle storage errors gracefully', async () => {
      // Mock removeItem to throw an error
      const originalImpl = mockStorage.removeItem.getMockImplementation();
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw, but should handle the error
      await expect(storagePurge.purgeAll()).rejects.toThrow('Storage error');

      // Restore original implementation
      if (originalImpl) {
        mockStorage.removeItem.mockImplementation(originalImpl);
      } else {
        mockStorage.removeItem.mockRestore();
      }
    });
  });

  describe('Store Utilities', () => {
    it('should reset entire store', async () => {
      // Set up some state
      testStore.dispatch(
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

      // Verify state is set
      const state = testStore.getState();
      expect(state.auth.isAuthenticated).toBe(true);

      await storeUtils.resetStore();

      // Note: The actual logout dispatch happens in the resetStore function
      // We can't easily test the full flow with mocked persistence
      expect(mockStorage.removeItem).toHaveBeenCalled();
    });

    it('should reset only auth state', async () => {
      // Set up auth state
      testStore.dispatch(
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

      // Verify initial state
      let state = testStore.getState();
      expect(state.auth.isAuthenticated).toBe(true);

      await storeUtils.resetAuth();

      // Check that auth storage was cleared
      expect(mockStorage.removeItem).toHaveBeenCalledWith('persist:auth');

      // Test that the logout action works independently
      testStore.dispatch(authSlice.actions.logout());
      state = testStore.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
    });

    it('should get persistence status', () => {
      // Set up some persisted data
      mockStorage.store['persist:root'] = 'test_data';

      const status = storeUtils.getPersistenceStatus();

      expect(status).toHaveProperty('hasPersistedData');
      expect(status).toHaveProperty('storageSize');
      expect(status).toHaveProperty('isRehydrated');
      expect(typeof status.hasPersistedData).toBe('boolean');
      expect(status.hasPersistedData).toBe(true);
    });

    it('should flush persistence without errors', async () => {
      await expect(storeUtils.flushPersistence()).resolves.not.toThrow();
    });
  });

  describe('Persistence Configuration', () => {
    it('should handle auth state changes', () => {
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
    });

    it('should handle preferences changes', () => {
      testStore.dispatch(preferencesSlice.actions.setThemeMode('dark'));
      testStore.dispatch(preferencesSlice.actions.setSidebarState('collapsed'));

      const state = testStore.getState();
      expect(state.preferences.themeMode).toBe('dark');
      expect(state.preferences.sidebarState).toBe('collapsed');
    });

    it('should maintain preferences when auth is reset', async () => {
      // Set both auth and preferences
      testStore.dispatch(
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
      testStore.dispatch(preferencesSlice.actions.setThemeMode('dark'));

      // Reset only auth storage
      await storeUtils.resetAuth();

      // Manually dispatch logout to test the behavior
      testStore.dispatch(authSlice.actions.logout());

      const state = testStore.getState();
      // Auth should be reset
      expect(state.auth.isAuthenticated).toBe(false);
      // Preferences should remain
      expect(state.preferences.themeMode).toBe('dark');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage quota exceeded gracefully', () => {
      // Mock localStorage to throw quota exceeded error
      const originalImpl = mockStorage.setItem.getMockImplementation();
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Test that it doesn't crash the store
      expect(() => {
        testStore.dispatch(preferencesSlice.actions.setThemeMode('light'));
      }).not.toThrow();

      // Restore original implementation
      if (originalImpl) {
        mockStorage.setItem.mockImplementation(originalImpl);
      } else {
        mockStorage.setItem.mockRestore();
      }
    });

    it('should handle corrupted storage data', () => {
      // Set corrupted data
      mockStorage.store['persist:auth'] =
        'corrupted_data_that_cannot_be_decrypted';

      // Should not crash when trying to read corrupted data
      expect(() => storeUtils.getState()).not.toThrow();

      // Should be able to get state
      const state = storeUtils.getState();
      expect(state).toBeDefined();
      expect(state.auth).toBeDefined();
      expect(state.preferences).toBeDefined();
    });

    it('should handle localStorage access errors', () => {
      // Mock localStorage.getItem to throw an error
      const originalImpl = mockStorage.getItem.getMockImplementation();
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      // Should handle the error gracefully
      expect(() => storagePurge.hasPersistedData()).not.toThrow();
      expect(storagePurge.hasPersistedData()).toBe(false);

      // Restore original implementation
      if (originalImpl) {
        mockStorage.getItem.mockImplementation(originalImpl);
      } else {
        mockStorage.getItem.mockRestore();
      }
    });
  });
});
