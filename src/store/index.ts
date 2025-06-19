/**
 * Redux store configuration for Solarium Web Portal
 * Configures the main Redux store with RTK and middleware
 */

import { configureStore, combineReducers, Store } from '@reduxjs/toolkit';
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
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import { authPersistConfig, persistenceUtils } from './persistConfig';
import { apiSlice } from '../api/apiSlice';
import { errorMiddleware } from './middleware/errorMiddleware';

// Create root reducer
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  ui: uiSlice, // UI slice is not persisted
  [apiSlice.reducerPath]: apiSlice.reducer,
});

/**
 * Configure the Redux store with all slices and middleware
 * @returns Configured Redux store
 */
export const configureAppStore = (): { store: Store; persistor: any } => {
  const isPersistenceValid = persistenceUtils.validateConfig();

  if (!isPersistenceValid) {
    console.warn(
      'Redux persistence may not work correctly due to configuration issues'
    );
  }

  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        },
      })
        .concat(apiSlice.middleware)
        .concat(errorMiddleware),
    devTools: process.env.NODE_ENV === 'development',
  });

  const persistor = persistStore(store);
  return { store, persistor };
};

// Create the store and persistor instances
const { store } = configureAppStore();

// Export store and persistor instances
export default store;

/**
 * Store module exports
 * Centralizes all store-related exports for easy importing
 */

// Store configuration and types
export { store, persistor, storeUtils } from './store';
export type { RootState, AppDispatch } from './store';

// Hooks
export { useAppDispatch, useAppSelector } from './hooks';

// Slices are imported and used in store configuration above

// Persistence configuration
export { persistConfig, persistenceUtils } from './persistConfig';

// Listener middleware
export { listenerMiddleware, listenerUtils } from './listenerMiddleware';

// API slice
export { apiSlice } from '../api/apiSlice';

console.log('📦 Store module exports ready');
