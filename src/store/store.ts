/**
 * Redux Toolkit Store Configuration for Solarium Web Portal
 * Configures store with RTK Query, persistence, and listener middleware
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

// Import slices
import authSlice from './slices/authSlice';
import { uiSlice } from './slices/uiSlice';
import preferencesSlice from './slices/preferencesSlice';

// Import API slice
import { apiSlice } from '../api/apiSlice';

// Import middleware and persistence
import { listenerMiddleware } from './listenerMiddleware';
import { persistConfig } from './persistConfig';
import { isDevelopment } from '../config/environment';

/**
 * Root reducer combining all feature slices
 */
const rootReducer = combineReducers({
  auth: authSlice,
  ui: uiSlice.reducer,
  preferences: preferencesSlice,
  // RTK Query API slice
  [apiSlice.reducerPath]: apiSlice.reducer,
});

/**
 * Persisted reducer with encryption for sensitive data
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure the Redux store with all middleware
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['persist'],
      },
      // Enable immutability and serializability checks in development
      immutableCheck: {
        warnAfter: 128, // Warn if check takes longer than 128ms
      },
    })
      // Add RTK Query middleware
      .concat(apiSlice.middleware)
      // Add listener middleware for cross-cutting concerns
      .concat(listenerMiddleware.middleware),

  // Enable Redux DevTools only in development
  devTools: isDevelopment() && {
    name: 'Solarium Web Portal',
    trace: true,
    traceLimit: 25,
  },
});

/**
 * Create persistor for state persistence
 */
export const persistor = persistStore(store);

/**
 * Set up RTK Query listeners for refetchOnFocus and other behaviors
 */
setupListeners(store.dispatch);

/**
 * Export store types for TypeScript
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Store utilities for persistence and debugging
 */
export const storeUtils = {
  /**
   * Flush persistence to ensure immediate save
   */
  flushPersistence: async (): Promise<void> => {
    await persistor.flush();
  },

  /**
   * Reset authentication state and clear persistence
   */
  resetAuth: async (): Promise<void> => {
    return new Promise(resolve => {
      // Purge only auth-related persistence
      persistor.purge().then(() => {
        resolve();
      });
    });
  },

  /**
   * Get current store state (for debugging)
   */
  getState: (): RootState => store.getState(),

  /**
   * Check if store is rehydrated
   */
  isRehydrated: (): boolean => {
    const state = store.getState();
    return (state as any)._persist?.rehydrated === true;
  },
};

// Development helpers
if (isDevelopment()) {
  // Expose store to window for debugging
  (window as any).__REDUX_STORE__ = store;
  (window as any).__STORE_UTILS__ = storeUtils;

  console.log('🏪 Redux store configured with:');
  console.log('  - RTK Query middleware');
  console.log('  - Encrypted persistence');
  console.log('  - Listener middleware');
  console.log('  - DevTools enabled');
}
