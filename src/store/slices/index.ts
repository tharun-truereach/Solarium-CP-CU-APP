/**
 * Slices barrel file for Redux store
 * Re-exports slice reducers only to avoid naming conflicts
 * Import actions directly from individual slice files when needed
 */

// Authentication slice (persisted)
export { default as authSlice } from './authSlice';

// UI slice (not persisted)
export { default as uiSlice } from './uiSlice';

// Preferences slice (persisted) - if it exists
// export { default as preferencesSlice } from './preferencesSlice';

// Settings slice (not persisted - refreshed from API)
export { default as settingsSlice } from './settingsSlice';
