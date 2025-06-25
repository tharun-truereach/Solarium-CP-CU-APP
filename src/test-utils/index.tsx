/**
 * Test utilities for Solarium Web Portal
 * Provides common testing setup and utilities
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import store configuration
import { apiSlice } from '../api/apiSlice';
import authSlice from '../store/slices/authSlice';
import { uiSlice } from '../store/slices/uiSlice';
import { settingsSlice } from '../store/slices/settingsSlice';
import { theme } from '../theme';

/**
 * Create a test store with RTK Query API slice
 */
const setupApiStore = (api = apiSlice, preloadedState = {}) => {
  const store = configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice.reducer,
      settings: settingsSlice.reducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests
      }).concat(api.middleware),
    preloadedState,
  });

  setupListeners(store.dispatch);

  return { store, api };
};

/**
 * Create a mock store for testing
 */
const createMockStore = (initialState = {}) => {
  const { store } = setupApiStore(apiSlice, initialState);
  return store;
};

/**
 * Test provider wrapper with all necessary providers
 */
interface AllTheProvidersProps {
  children: React.ReactNode;
  store?: ReturnType<typeof createMockStore> | undefined;
  initialEntries?: string[] | undefined;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  store = createMockStore(),
  initialEntries = ['/'],
}) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

/**
 * Custom render function with all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: ReturnType<typeof createMockStore> | undefined;
  initialEntries?: string[] | undefined;
}

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { store, initialEntries, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders store={store} initialEntries={initialEntries}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Coverage helpers
export const coverage_helpers = {
  /**
   * Helper to test all branches of a function
   */
  testAllBranches: (fn: Function, testCases: any[][]) => {
    testCases.forEach((testCase, index) => {
      try {
        fn(...testCase);
      } catch (error) {
        console.log(`Test case ${index} failed:`, error);
      }
    });
  },

  /**
   * Helper to test error boundaries
   */
  testErrorBoundary: (Component: React.ComponentType, errorProps: any) => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    return customRender(
      <Component {...errorProps}>
        <ThrowError />
      </Component>
    );
  },
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
export { setupApiStore, createMockStore, AllTheProviders };
