/**
 * Redux slices index
 * Centralized exports for all Redux slices
 */

export { default as authSlice } from './authSlice';
export { default as uiSlice } from './uiSlice';
export { default as preferencesSlice } from './preferencesSlice';

// Export action creators
export * from './authSlice';
// export * from './uiSlice';
// export * from './preferencesSlice';

// Export types
export type { AuthState } from './authSlice';
export type { UIState, ToastMessage, ToastSeverity } from './uiSlice';
