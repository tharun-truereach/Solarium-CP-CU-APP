/**
 * Redux Toolkit Listener Middleware configuration
 * Handles side effects and cross-slice logic for the Solarium Web Portal
 */

import { createListenerMiddleware, addListener } from '@reduxjs/toolkit';
import { config } from '../config/environment';

/**
 * Create listener middleware instance with proper typing
 */
export const listenerMiddleware = createListenerMiddleware({
  // Optional configuration
  onError: (error, _listenerApi) => {
    console.error('🎧 Listener middleware error:', error);

    // In development, provide more detailed error information
    if (config.environment === 'DEV') {
      console.error('🎧 Listener error details:', {
        error,
        // action: listenerApi.getOriginalState(),
        // state: listenerApi.getState(),
      });
    }
  },
});

/**
 * Type-safe version of addListener
 */
export const addAppListener = addListener;

/**
 * Export the listener middleware for store configuration
 */
export const { middleware } = listenerMiddleware;

/**
 * Utility to start listening to specific actions
 * This is a scaffold - actual listeners will be added in subsequent tasks
 */
export const startAppListening = listenerMiddleware.startListening;

/**
 * Development utilities for debugging listeners
 */
if (config.environment === 'DEV') {
  // Log when listeners are added/removed
  const originalStartListening = listenerMiddleware.startListening;
  listenerMiddleware.startListening = ((options: any) => {
    console.log(
      '🎧 Adding listener for:',
      options.actionCreator?.type || options.type || 'unknown'
    );
    return originalStartListening(options);
  }) as any;
}

/**
 * Listener management utilities
 */
export const listenerUtils = {
  /**
   * Get count of active listeners (development only)
   */
  getActiveListenersCount: () => {
    if (config.environment === 'DEV') {
      // This is a development utility - in a real implementation,
      // we would need to track listeners manually or use internal APIs
      return 0; // Placeholder
    }
    return null;
  },

  /**
   * Clear all listeners (useful for testing)
   */
  clearListeners: () => {
    listenerMiddleware.clearListeners();
  },
};

// Export types for use in other files
export type AppListenerApi = Parameters<
  Parameters<typeof startAppListening>[0]['effect']
>[1];
export type AppStartListening = typeof startAppListening;
