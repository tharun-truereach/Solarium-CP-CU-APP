/**
 * Redux Toolkit Listener Middleware
 * Handles cross-cutting concerns like session management and error handling
 */
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { RootState } from './store';

// Import actions that we'll listen for
import { login, logout, setError as setAuthError } from './slices/authSlice';
import { showToast } from './slices/uiSlice';

/**
 * Create typed listener middleware
 */
export const listenerMiddleware = createListenerMiddleware();

/**
 * Session management listeners
 */

// Listen for successful login
listenerMiddleware.startListening({
  actionCreator: login,
  effect: async (action, listenerApi) => {
    const { payload } = action;

    console.log('🔐 User logged in successfully:', payload.user.email);

    // Show welcome toast
    listenerApi.dispatch(
      showToast({
        message: `Welcome back, ${payload.user.name}!`,
        severity: 'success',
        duration: 5000,
      })
    );

    // Log analytics event (if enabled)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'login', {
        event_category: 'authentication',
        event_label: payload.user.role,
      });
    }
  },
});

// Listen for logout
listenerMiddleware.startListening({
  actionCreator: logout,
  effect: async (action, listenerApi) => {
    console.log('🚪 User logged out');

    // Show goodbye message
    listenerApi.dispatch(
      showToast({
        message: 'You have been logged out successfully',
        severity: 'info',
        duration: 3000,
      })
    );

    // Clear any cached data if needed
    // This will be expanded in future sub-tasks
  },
});

/**
 * Error handling listeners
 */

// Listen for authentication errors
listenerMiddleware.startListening({
  actionCreator: setAuthError,
  effect: async (action, listenerApi) => {
    const errorMessage = action.payload;

    if (errorMessage) {
      console.error('🔴 Authentication error:', errorMessage);

      // Show error toast for auth failures
      listenerApi.dispatch(
        showToast({
          message: errorMessage,
          severity: 'error',
          duration: 8000,
        })
      );
    }
  },
});

// Listen for RTK Query errors (placeholder for future implementation)
listenerMiddleware.startListening({
  matcher: isAnyOf(),
  // This will be expanded when we add RTK Query endpoints
  // For now, we'll add a placeholder matcher
  effect: async (action, _listenerApi) => {
    // RTK Query error handling will be implemented in future sub-tasks
    // This is a placeholder for the infrastructure
    console.log('🔄 RTK Query action detected:', action.type);
  },
});

/**
 * Generic error listener for unhandled promise rejections
 */
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', event => {
    console.error('🚨 Unhandled promise rejection:', event.reason);

    // Log to error service (will be implemented in future sub-tasks)
    // For now, just log to console
  });
}

/**
 * Development helpers
 */
if (process.env.NODE_ENV === 'development') {
  // Log all actions for debugging
  listenerMiddleware.startListening({
    predicate: () => true,
    effect: (action, listenerApi) => {
      const state = listenerApi.getState() as RootState;
      console.log('🎬 Action dispatched:', action.type, {
        action,
        state: {
          auth: state.auth.user
            ? {
                user: state.auth.user.email,
                isAuthenticated: state.auth.isAuthenticated,
              }
            : null,
          ui: state.ui,
        },
      });
    },
  });
}

/**
 * Listener utilities for starting/stopping listeners programmatically
 */
export const listenerUtils = {
  /**
   * Start all listeners (called automatically when middleware is added to store)
   */
  startAll: () => {
    console.log('🎧 All listeners started');
  },

  /**
   * Clear all listeners (useful for testing)
   */
  clearAll: () => {
    listenerMiddleware.clearListeners();
    console.log('🧹 All listeners cleared');
  },

  /**
   * Get listener statistics
   */
  getStats: () => {
    // This would return listener statistics in a real implementation
    return {
      activeListeners: 'listeners are active', // Placeholder
      totalActions: 'total actions processed', // Placeholder
    };
  },
};
