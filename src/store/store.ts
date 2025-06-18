/**
 * Redux Toolkit store configuration for Solarium Web Portal
 * Enhanced store with RTK Query integration, middleware setup, and environment-aware DevTools
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { config } from '../config/environment';
import baseApi from '../api/baseApi';
import { authSlice } from './slices/authSlice';
import { preferencesSlice } from './slices/preferencesSlice';
import { listenerMiddleware } from './listenerMiddleware';
import {
  createEncryptedTransform,
  storagePurge,
  persistenceErrorHandlers,
  persistenceDebugUtils,
} from './persistence/encryptedTransform';

/**
 * Create encryption transform instance with error handling
 */
const encryptTransformInstance = createEncryptedTransform(config.cryptoSecret);

/**
 * Enhanced Redux persist configuration
 * Persists auth and preferences slices with AES-256 encryption
 */
const persistConfig = {
  key: 'root',
  version: 1,
  storage,

  // Only persist auth and preferences slices for security and performance
  whitelist: ['auth', 'preferences'],

  // Apply encryption transform to sensitive data
  transforms: [encryptTransformInstance],

  // Timeout for rehydration (10 seconds)
  timeout: 10000,

  // Throttle writes to storage (ms) to improve performance
  throttle: 1000,

  // Debug logging in development
  debug: config.environment === 'DEV',
};

/**
 * Separate persistence config for auth slice (more frequent updates)
 */
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'refreshToken', 'expiresAt', 'isAuthenticated'],
  transforms: [encryptTransformInstance],
  throttle: 500, // More frequent updates for auth
};

/**
 * Separate persistence config for preferences (less sensitive, less frequent)
 */
const preferencesPersistConfig = {
  key: 'preferences',
  storage,
  blacklist: ['lastVisitedPage', 'recentSearches'], // Don't persist session-only data
  throttle: 2000, // Less frequent updates for preferences
};

/**
 * Root reducer combining all feature slices and API reducer
 */
const rootReducer = combineReducers({
  // Feature slices with individual persistence configs
  auth: persistReducer(authPersistConfig, authSlice.reducer),
  preferences: persistReducer(
    preferencesPersistConfig,
    preferencesSlice.reducer
  ),

  // RTK Query API slice (not persisted for security)
  [baseApi.reducerPath]: baseApi.reducer,
});

/**
 * Main persisted reducer (for root-level persistence)
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure and create the Redux store
 * Includes RTK Query middleware, listener middleware, and enhanced persistence
 */
export const configureAppStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        // Configure serializable check to ignore redux-persist actions
        serializableCheck: {
          ignoredActions: [
            FLUSH,
            REHYDRATE,
            PAUSE,
            PERSIST,
            PURGE,
            REGISTER,
            // Also ignore RTK Query action types
            'api/executeQuery/pending',
            'api/executeQuery/fulfilled',
            'api/executeQuery/rejected',
          ],
          // Ignore non-serializable values in these paths
          ignoredPaths: [
            'register',
            'rehydrate',
            'api.queries',
            'api.mutations',
          ],
        },
        // Disable immutability check in production for performance
        immutableCheck: config.environment === 'PROD' ? false : true,
      })
        // Add RTK Query middleware for caching, invalidation, polling, etc.
        .concat(baseApi.middleware)
        // Add listener middleware for side effects
        .concat(listenerMiddleware.middleware),

    // Enable Redux DevTools only in non-production environments
    devTools: config.environment !== 'PROD' && config.showReduxDevtools,
  });

  // Setup RTK Query listeners for cache management
  setupListeners(store.dispatch);

  return store;
};

/**
 * Create store instance
 */
export const store = configureAppStore();

/**
 * Create persistor for redux-persist with enhanced error handling
 */
export const persistor = persistStore(store, null, () => {
  if (config.environment === 'DEV') {
    console.log('✅ Redux persist initialized successfully');
    persistenceDebugUtils.logPersistenceState();
  }
});

/**
 * Root state type derived from the store
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * App dispatch type derived from the store
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Enhanced store utilities for testing, debugging, and persistence management
 */
export const storeUtils = {
  /**
   * Reset the entire store state (useful for logout)
   */
  resetStore: async (): Promise<void> => {
    try {
      // Purge persisted data
      await storagePurge.purgeAll();

      // Reset API cache
      store.dispatch(baseApi.util.resetApiState());

      // Pause persistor to prevent immediate re-persistence
      persistor.pause();

      // Flush any pending persist operations
      await persistor.flush();

      // Resume persistor
      persistor.persist();

      console.log('✅ Store reset completed');
    } catch (error) {
      console.error('❌ Store reset failed:', error);
      throw error;
    }
  },

  /**
   * Reset only auth state (for logout scenarios)
   */
  resetAuth: async (): Promise<void> => {
    try {
      await storagePurge.purgeAuth();
      store.dispatch(authSlice.actions.logout());
      console.log('✅ Auth reset completed');
    } catch (error) {
      console.error('❌ Auth reset failed:', error);
      throw error;
    }
  },

  /**
   * Get current store state (debugging utility)
   */
  getState: () => store.getState(),

  /**
   * Check if store is rehydrated
   */
  isRehydrated: () => {
    const state = store.getState();
    return !!(state as any)._persist?.rehydrated;
  },

  /**
   * Get persistence status
   */
  getPersistenceStatus: () => {
    return {
      hasPersistedData: storagePurge.hasPersistedData(),
      storageSize: storagePurge.getStorageSize(),
      isRehydrated: storeUtils.isRehydrated(),
    };
  },

  /**
   * Force persistence flush (useful before critical operations)
   */
  flushPersistence: async (): Promise<void> => {
    try {
      await persistor.flush();
      console.log('✅ Persistence flushed');
    } catch (error) {
      console.error('❌ Persistence flush failed:', error);
      throw error;
    }
  },

  /**
   * Secret rotation utility (for security)
   */
  rotateEncryptionSecret: async (newSecret: string): Promise<void> => {
    try {
      await storagePurge.rotateSecret(config.cryptoSecret, newSecret);
      console.log('✅ Encryption secret rotated');
    } catch (error) {
      console.error('❌ Secret rotation failed:', error);
      throw error;
    }
  },
};

/**
 * Environment-specific store configuration logging
 */
if (config.environment === 'DEV') {
  console.log('🏪 Redux store configured with enhanced persistence');

  // Test encryption in development
  persistenceDebugUtils.testEncryption();

  // Add global store utils for debugging
  (window as any).__STORE_UTILS__ = storeUtils;
}

/**
 * Handle storage quota exceeded errors
 */
window.addEventListener('error', event => {
  if (
    event.message?.includes('QuotaExceededError') ||
    event.message?.includes('Storage quota exceeded')
  ) {
    persistenceErrorHandlers.onStorageQuotaExceeded();
  }
});

/**
 * Handle page visibility changes to optimize persistence
 */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Flush persistence when page becomes hidden (user switches tabs/minimizes)
    storeUtils.flushPersistence().catch(console.error);
  }
});
