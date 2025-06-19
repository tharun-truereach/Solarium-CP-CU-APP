/**
 * Store Initialization Tests
 * Tests for Redux store configuration, persistence, and middleware setup
 */
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { store, persistor, storeUtils } from '../store/store';
import { encryptionUtils } from '../store/persistence/encryptedTransform';
import { persistenceUtils } from '../store/persistConfig';
import { listenerUtils } from '../store/listenerMiddleware';
import { baseQueryUtils } from '../api/baseQuery';

describe('Store Initialization', () => {
  beforeEach(() => {
    // Reset store state before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });

  describe('Store Configuration', () => {
    it('should initialize store without errors', () => {
      expect(store).toBeDefined();
      expect(store.getState).toBeDefined();
      expect(typeof store.dispatch).toBe('function');
    });

    it('should have correct initial state structure', () => {
      const state = store.getState();

      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('ui');
      expect(state).toHaveProperty('preferences');
      expect(state).toHaveProperty('api');
    });

    it('should initialize persistor', () => {
      expect(persistor).toBeDefined();
      expect(typeof persistor.flush).toBe('function');
      expect(typeof persistor.purge).toBe('function');
    });

    it('should provide store utilities', () => {
      expect(storeUtils).toBeDefined();
      expect(typeof storeUtils.flushPersistence).toBe('function');
      expect(typeof storeUtils.resetAuth).toBe('function');
      expect(typeof storeUtils.getState).toBe('function');
      expect(typeof storeUtils.isRehydrated).toBe('function');
    });
  });

  describe('Persistence Configuration', () => {
    it('should validate persistence configuration', () => {
      const isValid = persistenceUtils.validateConfig();
      expect(isValid).toBe(true);
    });

    it('should provide persistence utilities', async () => {
      expect(typeof persistenceUtils.clearAll).toBe('function');
      expect(typeof persistenceUtils.getInfo).toBe('function');

      // Test getting persistence info
      const info = await persistenceUtils.getInfo();
      expect(typeof info).toBe('object');
    });
  });

  describe('Encryption Transform', () => {
    const testKey = 'test-encryption-key-32-characters-long';

    it('should validate encryption key', () => {
      const validation = encryptionUtils.validateSecretKey(testKey);
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should test encryption functionality', () => {
      const testResult = encryptionUtils.testEncryption(testKey);
      expect(testResult).toBe(true);
    });

    it('should generate secure keys', () => {
      const generatedKey = encryptionUtils.generateSecureKey();
      expect(generatedKey).toHaveLength(32);
      expect(typeof generatedKey).toBe('string');
    });

    it('should handle invalid encryption keys', () => {
      const shortKey = 'short';
      const validation = encryptionUtils.validateSecretKey(shortKey);
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Listener Middleware', () => {
    it('should provide listener utilities', () => {
      expect(listenerUtils).toBeDefined();
      expect(typeof listenerUtils.startAll).toBe('function');
      expect(typeof listenerUtils.clearAll).toBe('function');
      expect(typeof listenerUtils.getStats).toBe('function');
    });

    it('should handle listener statistics', () => {
      const stats = listenerUtils.getStats();
      expect(typeof stats).toBe('object');
    });
  });

  describe('Base Query Configuration', () => {
    it('should provide base query utilities', () => {
      expect(baseQueryUtils).toBeDefined();
      expect(typeof baseQueryUtils.isInitialized).toBe('function');
      expect(typeof baseQueryUtils.getInfo).toBe('function');
      expect(typeof baseQueryUtils.createRequest).toBe('function');
    });

    it('should create request objects correctly', () => {
      const request = baseQueryUtils.createRequest('/test', 'GET', {
        params: { id: 1 },
        headers: { 'Content-Type': 'application/json' },
      });

      expect(request).toEqual({
        url: '/test',
        method: 'GET',
        params: { id: 1 },
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should report initialization status', () => {
      const info = baseQueryUtils.getInfo();
      expect(info).toHaveProperty('initialized');
      expect(info).toHaveProperty('axiosInstanceType');
    });
  });

  describe('Store Actions and State', () => {
    it('should handle auth slice actions', () => {
      const initialState = store.getState();
      expect(initialState.auth).toBeDefined();
      expect(initialState.auth.isAuthenticated).toBe(false);
    });

    it('should handle UI slice actions', () => {
      const initialState = store.getState();
      expect(initialState.ui).toBeDefined();
    });

    it('should handle preferences slice', () => {
      const initialState = store.getState();
      expect(initialState.preferences).toBeDefined();
    });
  });

  describe('DevTools and Development Features', () => {
    it('should expose store to window in development', () => {
      if (process.env.NODE_ENV === 'development') {
        expect((window as any).__REDUX_STORE__).toBe(store);
        expect((window as any).__STORE_UTILS__).toBe(storeUtils);
      }
    });
  });

  describe('Store Utilities', () => {
    it('should flush persistence', async () => {
      await expect(storeUtils.flushPersistence()).resolves.toBeUndefined();
    });

    it('should reset auth state', async () => {
      await expect(storeUtils.resetAuth()).resolves.toBeUndefined();
    });

    it('should get current state', () => {
      const state = storeUtils.getState();
      expect(state).toBeDefined();
      expect(state).toHaveProperty('auth');
    });

    it('should check rehydration status', () => {
      const isRehydrated = storeUtils.isRehydrated();
      expect(typeof isRehydrated).toBe('boolean');
    });
  });
});
