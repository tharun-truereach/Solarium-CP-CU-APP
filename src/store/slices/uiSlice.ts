/**
 * UI slice for managing global UI state
 * Handles toasts, loading states, and other UI concerns
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

/**
 * Toast severity levels
 */
export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast message interface
 */
export interface ToastMessage {
  id?: string;
  message: string;
  severity: ToastSeverity;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

/**
 * Error toast interface (for backward compatibility)
 */
export interface ErrorToast {
  show: boolean;
  message: string;
  severity: ToastSeverity;
}

/**
 * UI state interface
 */
export interface UIState {
  // Loading states
  isGlobalLoading: boolean;
  loadingMessage?: string;

  // Toast system
  toasts: ToastMessage[];

  // Error toast (legacy - for backward compatibility)
  errorToast: ErrorToast;

  // Modal states
  modals: {
    sessionTimeout: boolean;
    confirmDialog: boolean;
  };

  // Sidebar state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme preferences
  darkMode: boolean;
}

/**
 * Initial UI state
 */
const initialState: UIState = {
  isGlobalLoading: false,
  toasts: [],
  errorToast: {
    show: false,
    message: '',
    severity: 'error',
  },
  modals: {
    sessionTimeout: false,
    confirmDialog: false,
  },
  sidebarOpen: false,
  sidebarCollapsed: false,
  darkMode: false,
};

/**
 * Generate unique ID for toasts
 */
const generateToastId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * UI slice
 */
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Show a toast message
     */
    showToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
      const toast: ToastMessage = {
        ...action.payload,
        id: generateToastId(),
        duration: action.payload.duration ?? 5000,
      };

      state.toasts.push(toast);

      // Also update error toast for backward compatibility
      if (action.payload.severity === 'error') {
        state.errorToast = {
          show: true,
          message: action.payload.message,
          severity: action.payload.severity,
        };
      }
    },

    /**
     * Hide a specific toast
     */
    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },

    /**
     * Clear all toasts
     */
    clearAllToasts: state => {
      state.toasts = [];
      state.errorToast.show = false;
    },

    /**
     * Show error toast (legacy method for backward compatibility)
     */
    showError: (
      state,
      action: PayloadAction<{ message: string; severity?: ToastSeverity }>
    ) => {
      const { message, severity = 'error' } = action.payload;

      state.errorToast = {
        show: true,
        message,
        severity,
      };

      // Also add to new toast system
      const toast: ToastMessage = {
        id: generateToastId(),
        message,
        severity,
        duration: severity === 'error' ? 8000 : 5000,
      };

      state.toasts.push(toast);
    },

    /**
     * Clear error toast (legacy method for backward compatibility)
     */
    clearError: state => {
      state.errorToast.show = false;
    },

    /**
     * Set global loading state
     */
    setGlobalLoading: (
      state,
      action: PayloadAction<{ loading: boolean; message?: string }>
    ) => {
      state.isGlobalLoading = action.payload.loading;
      if (action.payload.message !== undefined) {
        state.loadingMessage = action.payload.message;
      }
    },

    /**
     * Toggle sidebar open/closed
     */
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    /**
     * Set sidebar collapsed state
     */
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    /**
     * Toggle dark mode
     */
    toggleDarkMode: state => {
      state.darkMode = !state.darkMode;
    },

    /**
     * Set dark mode
     */
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },

    /**
     * Show session timeout modal
     */
    showSessionTimeoutModal: state => {
      state.modals.sessionTimeout = true;
    },

    /**
     * Hide session timeout modal
     */
    hideSessionTimeoutModal: state => {
      state.modals.sessionTimeout = false;
    },

    /**
     * Show confirm dialog
     */
    showConfirmDialog: state => {
      state.modals.confirmDialog = true;
    },

    /**
     * Hide confirm dialog
     */
    hideConfirmDialog: state => {
      state.modals.confirmDialog = false;
    },
  },
});

/**
 * Export actions
 */
export const {
  showToast,
  hideToast,
  clearAllToasts,
  showError,
  clearError,
  setGlobalLoading,
  toggleSidebar,
  setSidebarCollapsed,
  toggleDarkMode,
  setDarkMode,
  showSessionTimeoutModal,
  hideSessionTimeoutModal,
  showConfirmDialog,
  hideConfirmDialog,
} = uiSlice.actions;

/**
 * Selectors
 */
export const selectUI = (state: RootState) => state.ui;
export const selectToasts = (state: RootState) => state.ui.toasts;
export const selectErrorToast = (state: RootState) => state.ui.errorToast;
export const selectIsGlobalLoading = (state: RootState) =>
  state.ui.isGlobalLoading;
export const selectLoadingMessage = (state: RootState) =>
  state.ui.loadingMessage;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: RootState) =>
  state.ui.sidebarCollapsed;
export const selectDarkMode = (state: RootState) => state.ui.darkMode;
export const selectModals = (state: RootState) => state.ui.modals;

/**
 * Complex selectors
 */
export const selectActiveToasts = (state: RootState) =>
  state.ui.toasts.filter(
    (toast: ToastMessage) =>
      toast.duration === 0 || Date.now() < Date.now() + (toast.duration || 5000)
  );

export const selectHasActiveToasts = (state: RootState) =>
  selectActiveToasts(state).length > 0;

/**
 * Export reducer
 */
export default uiSlice.reducer;
