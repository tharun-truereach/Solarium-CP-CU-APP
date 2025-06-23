/**
 * Settings slice for Redux Toolkit
 * Manages system settings state without persistence - refreshed from API
 * Supports optimistic updates with rollback for feature flags
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  SystemSettings,
  FeatureFlags,
  SystemThresholds,
} from '../../types/settings.types';

/**
 * Settings slice state interface
 */
export interface SettingsState extends SystemSettings {
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;

  // Error state
  error: string | null;

  // Optimistic update tracking
  pendingUpdates: {
    featureFlags: Record<
      string,
      { flag: string; value: boolean; timestamp: string }
    >;
    thresholds: Record<
      string,
      { key: string; value: number; timestamp: string }
    >;
  };

  // Metadata
  lastSyncedAt: string | null;
  isDirty: boolean; // Has unsaved changes

  // Override to match optional properties from SystemSettings
  lastUpdated?: string;
  updatedBy?: string;
}

/**
 * Default system settings values
 */
const defaultSettings: SystemSettings = {
  sessionTimeoutMin: 30,
  tokenExpiryMin: 60,
  featureFlags: {
    ADVANCED_REPORTING: false,
    BETA_FEATURES: false,
    DARK_MODE: true,
    ANALYTICS: false,
    BULK_OPERATIONS: true,
    DEBUG_MODE: false,
  },
  thresholds: {
    MAX_FILE_SIZE: 10,
    SESSION_WARNING: 5,
    API_TIMEOUT: 30,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15,
    PASSWORD_MIN_LENGTH: 8,
  },
};

/**
 * Initial settings state with defaults
 */
const initialState: SettingsState = {
  ...defaultSettings,
  isLoading: false,
  isUpdating: false,
  error: null,
  pendingUpdates: {
    featureFlags: {},
    thresholds: {},
  },
  lastSyncedAt: null,
  isDirty: false,
};

/**
 * Settings slice with comprehensive state management
 */
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null; // Clear error when starting new operation
      }
    },

    /**
     * Set updating state
     */
    setUpdating: (state, action: PayloadAction<boolean>) => {
      state.isUpdating = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isUpdating = false;
    },

    /**
     * Clear error state
     */
    clearError: state => {
      state.error = null;
    },

    /**
     * Sync settings from API - replaces current state with server data
     */
    syncSettingsFromApi: (state, action: PayloadAction<SystemSettings>) => {
      const serverSettings = action.payload;

      // Update all settings from server
      state.sessionTimeoutMin = serverSettings.sessionTimeoutMin;
      state.tokenExpiryMin = serverSettings.tokenExpiryMin;
      state.featureFlags = { ...serverSettings.featureFlags };
      state.thresholds = { ...serverSettings.thresholds };
      if (serverSettings.lastUpdated)
        state.lastUpdated = serverSettings.lastUpdated;
      if (serverSettings.updatedBy) state.updatedBy = serverSettings.updatedBy;

      // Reset state flags
      state.isLoading = false;
      state.isUpdating = false;
      state.error = null;
      state.isDirty = false;
      state.lastSyncedAt = new Date().toISOString();

      // Clear any pending updates as they're now applied
      state.pendingUpdates.featureFlags = {};
      state.pendingUpdates.thresholds = {};

      console.log('⚙️ Settings synced from API:', {
        sessionTimeout: serverSettings.sessionTimeoutMin,
        tokenExpiry: serverSettings.tokenExpiryMin,
        featureFlagsCount: Object.keys(serverSettings.featureFlags).length,
        thresholdsCount: Object.keys(serverSettings.thresholds).length,
        lastUpdated: serverSettings.lastUpdated,
      });
    },

    /**
     * Set feature flag pending state for optimistic updates
     */
    setFeatureFlagPending: (
      state,
      action: PayloadAction<{ flag: string; value: boolean }>
    ) => {
      const { flag, value } = action.payload;
      const timestamp = new Date().toISOString();

      // Store the pending update for potential rollback
      state.pendingUpdates.featureFlags[flag] = {
        flag,
        value: state.featureFlags[flag] ?? false, // Store current value for rollback
        timestamp,
      };

      // Apply optimistic update
      state.featureFlags[flag] = value;
      state.isDirty = true;

      console.log(`🚩 Feature flag ${flag} set to ${value} (optimistic)`);
    },

    /**
     * Set threshold pending state for optimistic updates
     */
    setThresholdPending: (
      state,
      action: PayloadAction<{ key: string; value: number }>
    ) => {
      const { key, value } = action.payload;
      const timestamp = new Date().toISOString();

      // Store the pending update for potential rollback
      state.pendingUpdates.thresholds[key] = {
        key,
        value: state.thresholds[key] ?? 0, // Store current value for rollback
        timestamp,
      };

      // Apply optimistic update
      state.thresholds[key] = value;
      state.isDirty = true;

      console.log(`📊 Threshold ${key} set to ${value} (optimistic)`);
    },

    /**
     * Rollback pending feature flag changes (on API failure)
     */
    rollbackFeatureFlagUpdates: state => {
      const pendingFlags = state.pendingUpdates.featureFlags;

      // Rollback all pending feature flag changes
      Object.values(pendingFlags).forEach(({ flag, value }) => {
        state.featureFlags[flag] = value; // Restore original value
        console.log(`↩️ Rolled back feature flag ${flag} to ${value}`);
      });

      // Clear pending updates
      state.pendingUpdates.featureFlags = {};
      state.isDirty = Object.keys(state.pendingUpdates.thresholds).length > 0;
    },

    /**
     * Rollback pending threshold changes (on API failure)
     */
    rollbackThresholdUpdates: state => {
      const pendingThresholds = state.pendingUpdates.thresholds;

      // Rollback all pending threshold changes
      Object.values(pendingThresholds).forEach(({ key, value }) => {
        state.thresholds[key] = value; // Restore original value
        console.log(`↩️ Rolled back threshold ${key} to ${value}`);
      });

      // Clear pending updates
      state.pendingUpdates.thresholds = {};
      state.isDirty = Object.keys(state.pendingUpdates.featureFlags).length > 0;
    },

    /**
     * Rollback all pending updates (comprehensive rollback)
     */
    rollbackAllPendingUpdates: state => {
      // Rollback feature flags
      Object.values(state.pendingUpdates.featureFlags).forEach(
        ({ flag, value }) => {
          state.featureFlags[flag] = value;
        }
      );

      // Rollback thresholds
      Object.values(state.pendingUpdates.thresholds).forEach(
        ({ key, value }) => {
          state.thresholds[key] = value;
        }
      );

      // Clear all pending updates
      state.pendingUpdates.featureFlags = {};
      state.pendingUpdates.thresholds = {};
      state.isDirty = false;

      console.log('↩️ All pending settings updates rolled back');
    },

    /**
     * Confirm pending updates (clear tracking after successful API update)
     */
    confirmPendingUpdates: state => {
      state.pendingUpdates.featureFlags = {};
      state.pendingUpdates.thresholds = {};
      state.isDirty = false;

      console.log('✅ Pending settings updates confirmed');
    },

    /**
     * Update session timeout
     */
    updateSessionTimeout: (state, action: PayloadAction<number>) => {
      state.sessionTimeoutMin = action.payload;
      state.isDirty = true;
    },

    /**
     * Update token expiry
     */
    updateTokenExpiry: (state, action: PayloadAction<number>) => {
      state.tokenExpiryMin = action.payload;
      state.isDirty = true;
    },

    /**
     * Reset all settings to defaults
     */
    resetToDefaults: state => {
      Object.assign(state, {
        ...initialState,
        lastSyncedAt: new Date().toISOString(),
      });

      console.log('🔄 Settings reset to defaults');
    },

    /**
     * Bulk update feature flags
     */
    updateFeatureFlags: (
      state,
      action: PayloadAction<Partial<FeatureFlags>>
    ) => {
      Object.assign(state.featureFlags, action.payload);
      state.isDirty = true;
    },

    /**
     * Bulk update thresholds
     */
    updateThresholds: (
      state,
      action: PayloadAction<Partial<SystemThresholds>>
    ) => {
      Object.assign(state.thresholds, action.payload);
      state.isDirty = true;
    },
  },
});

/**
 * Export action creators
 */
export const {
  setLoading,
  setUpdating,
  setError,
  clearError,
  syncSettingsFromApi,
  setFeatureFlagPending,
  setThresholdPending,
  rollbackFeatureFlagUpdates,
  rollbackThresholdUpdates,
  rollbackAllPendingUpdates,
  confirmPendingUpdates,
  updateSessionTimeout,
  updateTokenExpiry,
  resetToDefaults,
  updateFeatureFlags,
  updateThresholds,
} = settingsSlice.actions;

/**
 * Basic selectors for accessing settings state
 */
export const selectSettings = (state: RootState) => state.settings;
export const selectSettingsLoading = (state: RootState) =>
  state.settings.isLoading;
export const selectSettingsUpdating = (state: RootState) =>
  state.settings.isUpdating;
export const selectSettingsError = (state: RootState) => state.settings.error;
export const selectSettingsLastSynced = (state: RootState) =>
  state.settings.lastSyncedAt;
export const selectSettingsIsDirty = (state: RootState) =>
  state.settings.isDirty;

/**
 * Feature flag selectors with memoization
 */
export const selectFeatureFlags = (state: RootState) =>
  state.settings.featureFlags;

export const selectFeatureFlag = (flag: string) =>
  createSelector(
    [selectFeatureFlags],
    (featureFlags): boolean => featureFlags[flag] ?? false
  );

// Commonly used feature flag selectors
export const selectAdvancedReporting = createSelector(
  [selectFeatureFlags],
  flags => flags.ADVANCED_REPORTING ?? false
);

export const selectBetaFeatures = createSelector(
  [selectFeatureFlags],
  flags => flags.BETA_FEATURES ?? false
);

export const selectDarkMode = createSelector(
  [selectFeatureFlags],
  flags => flags.DARK_MODE ?? true
);

export const selectAnalytics = createSelector(
  [selectFeatureFlags],
  flags => flags.ANALYTICS ?? false
);

export const selectBulkOperations = createSelector(
  [selectFeatureFlags],
  flags => flags.BULK_OPERATIONS ?? true
);

export const selectDebugMode = createSelector(
  [selectFeatureFlags],
  flags => flags.DEBUG_MODE ?? false
);

/**
 * Threshold selectors with memoization
 */
export const selectThresholds = (state: RootState) => state.settings.thresholds;

export const selectThreshold = (key: string) =>
  createSelector(
    [selectThresholds],
    (thresholds): number => thresholds[key] ?? 0
  );

// Commonly used threshold selectors
export const selectMaxFileSize = createSelector(
  [selectThresholds],
  thresholds => thresholds.MAX_FILE_SIZE ?? 10
);

export const selectSessionWarning = createSelector(
  [selectThresholds],
  thresholds => thresholds.SESSION_WARNING ?? 5
);

export const selectApiTimeout = createSelector(
  [selectThresholds],
  thresholds => thresholds.API_TIMEOUT ?? 30
);

/**
 * Authentication setting selectors
 */
export const selectSessionTimeout = (state: RootState) =>
  state.settings.sessionTimeoutMin;
export const selectTokenExpiry = (state: RootState) =>
  state.settings.tokenExpiryMin;

/**
 * Pending updates selectors
 */
export const selectPendingUpdates = (state: RootState) =>
  state.settings.pendingUpdates;
export const selectHasPendingUpdates = createSelector(
  [selectPendingUpdates],
  pendingUpdates =>
    Object.keys(pendingUpdates.featureFlags).length > 0 ||
    Object.keys(pendingUpdates.thresholds).length > 0
);

/**
 * Settings summary selector for debugging/display
 */
export const selectSettingsSummary = createSelector(
  [selectSettings],
  settings => ({
    sessionTimeout: settings.sessionTimeoutMin,
    tokenExpiry: settings.tokenExpiryMin,
    enabledFlags: Object.entries(settings.featureFlags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag),
    thresholdCount: Object.keys(settings.thresholds).length,
    lastUpdated: settings.lastUpdated,
    isDirty: settings.isDirty,
    hasPending:
      Object.keys(settings.pendingUpdates.featureFlags).length > 0 ||
      Object.keys(settings.pendingUpdates.thresholds).length > 0,
  })
);

/**
 * Export the reducer
 */
export default settingsSlice.reducer;
