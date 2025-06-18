/**
 * Redux slices barrel export
 * Centralizes all slice exports for easy importing
 */

export { default as authSlice } from './authSlice';
export { default as uiSlice } from './uiSlice';

// Re-export all actions for convenience
export * from './authSlice';
export * from './uiSlice';
