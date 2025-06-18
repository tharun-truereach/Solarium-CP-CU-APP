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
import { authPersistConfig, validatePersistenceConfig } from './persistConfig';
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
  const isPersistenceValid = validatePersistenceConfig();

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
const { store, persistor } = configureAppStore();

// Export store types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

// Export store and persistor instances
export { store, persistor };
export default store;
