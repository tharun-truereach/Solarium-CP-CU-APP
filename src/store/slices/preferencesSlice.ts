/**
 * User preferences slice for Redux Toolkit
 * Manages UI preferences, settings, and user customization options
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Sidebar state options
 */
export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

/**
 * User preferences state interface
 */
export interface PreferencesState {
  // UI preferences
  themeMode: ThemeMode;
  sidebarState: SidebarState;
  language: string;

  // Table/List preferences
  defaultPageSize: number;
  compactMode: boolean;

  // Dashboard preferences
  dashboardLayout: string[];
  hiddenWidgets: string[];

  // Notification preferences
  enableNotifications: boolean;
  notificationSound: boolean;
  emailNotifications: boolean;

  // Advanced preferences
  enableAnimations: boolean;
  highContrast: boolean;
  reducedMotion: boolean;

  // Session preferences (not persisted)
  lastVisitedPage: string | null;
  recentSearches: string[];

  // Feature flags (user-level)
  enableBetaFeatures: boolean;
  enableAdvancedMode: boolean;
}

/**
 * Initial preferences state with sensible defaults
 */
const initialState: PreferencesState = {
  // UI preferences
  themeMode: 'system',
  sidebarState: 'expanded',
  language: 'en',

  // Table/List preferences
  defaultPageSize: 10,
  compactMode: false,

  // Dashboard preferences
  dashboardLayout: ['overview', 'recent-leads', 'quick-actions', 'stats'],
  hiddenWidgets: [],

  // Notification preferences
  enableNotifications: true,
  notificationSound: true,
  emailNotifications: true,

  // Advanced preferences
  enableAnimations: true,
  highContrast: false,
  reducedMotion: false,

  // Session preferences
  lastVisitedPage: null,
  recentSearches: [],

  // Feature flags
  enableBetaFeatures: false,
  enableAdvancedMode: false,
};

/**
 * Preferences slice with reducers
 */
export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    /**
     * Set theme mode
     */
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },

    /**
     * Set sidebar state
     */
    setSidebarState: (state, action: PayloadAction<SidebarState>) => {
      state.sidebarState = action.payload;
    },

    /**
     * Toggle sidebar between expanded and collapsed
     */
    toggleSidebar: state => {
      state.sidebarState =
        state.sidebarState === 'expanded' ? 'collapsed' : 'expanded';
    },

    /**
     * Set language preference
     */
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },

    /**
     * Set default page size for tables/lists
     */
    setDefaultPageSize: (state, action: PayloadAction<number>) => {
      state.defaultPageSize = action.payload;
    },

    /**
     * Toggle compact mode
     */
    toggleCompactMode: state => {
      state.compactMode = !state.compactMode;
    },

    /**
     * Update dashboard layout
     */
    setDashboardLayout: (state, action: PayloadAction<string[]>) => {
      state.dashboardLayout = action.payload;
    },

    /**
     * Hide/show dashboard widget
     */
    toggleWidget: (state, action: PayloadAction<string>) => {
      const widgetId = action.payload;
      const index = state.hiddenWidgets.indexOf(widgetId);

      if (index === -1) {
        state.hiddenWidgets.push(widgetId);
      } else {
        state.hiddenWidgets.splice(index, 1);
      }
    },

    /**
     * Update notification preferences
     */
    setNotificationPreferences: (
      state,
      action: PayloadAction<{
        enableNotifications?: boolean;
        notificationSound?: boolean;
        emailNotifications?: boolean;
      }>
    ) => {
      Object.assign(state, action.payload);
    },

    /**
     * Update accessibility preferences
     */
    setAccessibilityPreferences: (
      state,
      action: PayloadAction<{
        enableAnimations?: boolean;
        highContrast?: boolean;
        reducedMotion?: boolean;
      }>
    ) => {
      Object.assign(state, action.payload);
    },

    /**
     * Update last visited page
     */
    setLastVisitedPage: (state, action: PayloadAction<string>) => {
      state.lastVisitedPage = action.payload;
    },

    /**
     * Add to recent searches
     */
    addRecentSearch: (state, action: PayloadAction<string>) => {
      const search = action.payload.trim();
      if (search && !state.recentSearches.includes(search)) {
        state.recentSearches.unshift(search);
        // Keep only last 10 searches
        state.recentSearches = state.recentSearches.slice(0, 10);
      }
    },

    /**
     * Clear recent searches
     */
    clearRecentSearches: state => {
      state.recentSearches = [];
    },

    /**
     * Toggle beta features
     */
    toggleBetaFeatures: state => {
      state.enableBetaFeatures = !state.enableBetaFeatures;
    },

    /**
     * Toggle advanced mode
     */
    toggleAdvancedMode: state => {
      state.enableAdvancedMode = !state.enableAdvancedMode;
    },

    /**
     * Reset all preferences to defaults
     */
    resetPreferences: () => {
      return initialState;
    },

    /**
     * Bulk update preferences
     */
    updatePreferences: (
      state,
      action: PayloadAction<Partial<PreferencesState>>
    ) => {
      Object.assign(state, action.payload);
    },
  },
});

// Debug log to ensure slice is created
if (process.env.NODE_ENV === 'development') {
  console.log('🎛️ Preferences slice created:', preferencesSlice.name);
}

/**
 * Export action creators
 */
export const {
  setThemeMode,
  setSidebarState,
  toggleSidebar,
  setLanguage,
  setDefaultPageSize,
  toggleCompactMode,
  setDashboardLayout,
  toggleWidget,
  setNotificationPreferences,
  setAccessibilityPreferences,
  setLastVisitedPage,
  addRecentSearch,
  clearRecentSearches,
  toggleBetaFeatures,
  toggleAdvancedMode,
  resetPreferences,
  updatePreferences,
} = preferencesSlice.actions;

/**
 * Selectors for accessing preferences state
 */
export const selectPreferences = (state: RootState) => state.preferences;
export const selectThemeMode = (state: RootState) =>
  state.preferences.themeMode;
export const selectSidebarState = (state: RootState) =>
  state.preferences.sidebarState;
export const selectLanguage = (state: RootState) => state.preferences.language;
export const selectDefaultPageSize = (state: RootState) =>
  state.preferences.defaultPageSize;
export const selectCompactMode = (state: RootState) =>
  state.preferences.compactMode;
export const selectDashboardLayout = (state: RootState) =>
  state.preferences.dashboardLayout;
export const selectHiddenWidgets = (state: RootState) =>
  state.preferences.hiddenWidgets;
export const selectNotificationPreferences = (state: RootState) => ({
  enableNotifications: state.preferences.enableNotifications,
  notificationSound: state.preferences.notificationSound,
  emailNotifications: state.preferences.emailNotifications,
});
export const selectAccessibilityPreferences = (state: RootState) => ({
  enableAnimations: state.preferences.enableAnimations,
  highContrast: state.preferences.highContrast,
  reducedMotion: state.preferences.reducedMotion,
});
export const selectRecentSearches = (state: RootState) =>
  state.preferences.recentSearches;
export const selectBetaFeatures = (state: RootState) =>
  state.preferences.enableBetaFeatures;
export const selectAdvancedMode = (state: RootState) =>
  state.preferences.enableAdvancedMode;

/**
 * Export the reducer
 */
export default preferencesSlice.reducer;
