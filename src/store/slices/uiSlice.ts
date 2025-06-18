/**
 * UI slice for Redux store
 * Manages global UI state like loading indicators, error messages, etc.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  globalLoading: boolean;
  errorToast: {
    show: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'success';
  };
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  circuitBreakerOpen: boolean;
}

// Initial state for UI slice
const initialState: UIState = {
  globalLoading: false,
  errorToast: {
    show: false,
    message: '',
    severity: 'error',
  },
  sidebarOpen: true,
  theme: 'light',
  circuitBreakerOpen: false,
};

/**
 * UI slice with reducers for global UI state management
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Set global loading state
     */
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },

    /**
     * Show error toast with message
     */
    showError: (
      state,
      action: PayloadAction<{
        message: string;
        severity?: 'error' | 'warning' | 'info' | 'success';
      }>
    ) => {
      state.errorToast = {
        show: true,
        message: action.payload.message,
        severity: action.payload.severity || 'error',
      };
    },

    /**
     * Clear/hide error toast
     */
    clearError: state => {
      state.errorToast.show = false;
    },

    /**
     * Toggle sidebar open/closed
     */
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    /**
     * Set sidebar open state
     */
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    /**
     * Set theme (light/dark)
     */
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },

    setCircuitBreakerOpen: (state, action: PayloadAction<boolean>) => {
      state.circuitBreakerOpen = action.payload;
    },
  },
});

// Export actions
export const {
  setGlobalLoading,
  showError,
  clearError,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setCircuitBreakerOpen,
} = uiSlice.actions;

// Export selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectGlobalLoading = (state: { ui: UIState }) =>
  state.ui.globalLoading;
export const selectErrorToast = (state: { ui: UIState }) => state.ui.errorToast;
export const selectSidebarOpen = (state: { ui: UIState }) =>
  state.ui.sidebarOpen;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectCircuitBreakerOpen = (state: { ui: UIState }) =>
  state.ui.circuitBreakerOpen;

// Export reducer as default
export default uiSlice.reducer;
