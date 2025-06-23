/**
 * Settings slice test suite
 * Tests all reducers, selectors, and state management functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import settingsSlice, {
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
  selectFeatureFlag,
  selectAdvancedReporting,
  selectBetaFeatures,
  selectThreshold,
  selectMaxFileSize,
  selectHasPendingUpdates,
  selectSettingsSummary,
  type SettingsState,
} from '../settingsSlice';
import type { SystemSettings } from '../../../types/settings.types';
import type { RootState } from '../../store';

// Mock system settings data
const mockSettings: SystemSettings = {
  sessionTimeoutMin: 45,
  tokenExpiryMin: 90,
  featureFlags: {
    ADVANCED_REPORTING: true,
    BETA_FEATURES: false,
    DARK_MODE: true,
    ANALYTICS: true,
    BULK_OPERATIONS: true,
    DEBUG_MODE: false,
  },
  thresholds: {
    MAX_FILE_SIZE: 15,
    SESSION_WARNING: 10,
    API_TIMEOUT: 45,
    MAX_LOGIN_ATTEMPTS: 3,
    LOCKOUT_DURATION: 30,
    PASSWORD_MIN_LENGTH: 10,
  },
  lastUpdated: '2024-01-15T10:30:00Z',
  updatedBy: 'admin@solarium.com',
};

// Test store setup
const createTestStore = (initialState?: Partial<SettingsState>) => {
  return configureStore({
    reducer: {
      settings: settingsSlice,
    },
    ...(initialState && {
      preloadedState: { settings: initialState as SettingsState },
    }),
  });
};

describe('Settings Slice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().settings;

      expect(state.sessionTimeoutMin).toBe(30);
      expect(state.tokenExpiryMin).toBe(60);
      expect(state.isLoading).toBe(false);
      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe(null);
      expect(state.isDirty).toBe(false);
      expect(state.lastSyncedAt).toBe(null);
      expect(state.pendingUpdates.featureFlags).toEqual({});
      expect(state.pendingUpdates.thresholds).toEqual({});
    });

    it('should have default feature flags', () => {
      const state = store.getState().settings;

      expect(state.featureFlags.ADVANCED_REPORTING).toBe(false);
      expect(state.featureFlags.BETA_FEATURES).toBe(false);
      expect(state.featureFlags.DARK_MODE).toBe(true);
      expect(state.featureFlags.ANALYTICS).toBe(false);
      expect(state.featureFlags.BULK_OPERATIONS).toBe(true);
      expect(state.featureFlags.DEBUG_MODE).toBe(false);
    });

    it('should have default thresholds', () => {
      const state = store.getState().settings;

      expect(state.thresholds.MAX_FILE_SIZE).toBe(10);
      expect(state.thresholds.SESSION_WARNING).toBe(5);
      expect(state.thresholds.API_TIMEOUT).toBe(30);
      expect(state.thresholds.MAX_LOGIN_ATTEMPTS).toBe(5);
      expect(state.thresholds.LOCKOUT_DURATION).toBe(15);
      expect(state.thresholds.PASSWORD_MIN_LENGTH).toBe(8);
    });
  });

  describe('Loading State Management', () => {
    it('should set loading state', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().settings.isLoading).toBe(true);
      expect(store.getState().settings.error).toBe(null);
    });

    it('should set updating state', () => {
      store.dispatch(setUpdating(true));
      expect(store.getState().settings.isUpdating).toBe(true);
      expect(store.getState().settings.error).toBe(null);
    });

    it('should clear loading when setting error', () => {
      store.dispatch(setLoading(true));
      store.dispatch(setError('Test error'));

      const state = store.getState().settings;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Test error');
    });
  });

  describe('Sync Settings from API', () => {
    it('should sync settings from API correctly', () => {
      store.dispatch(syncSettingsFromApi(mockSettings));

      const state = store.getState().settings;
      expect(state.sessionTimeoutMin).toBe(45);
      expect(state.tokenExpiryMin).toBe(90);
      expect(state.featureFlags.ADVANCED_REPORTING).toBe(true);
      expect(state.featureFlags.ANALYTICS).toBe(true);
      expect(state.thresholds.MAX_FILE_SIZE).toBe(15);
      expect(state.thresholds.SESSION_WARNING).toBe(10);
      expect(state.lastUpdated).toBe('2024-01-15T10:30:00Z');
      expect(state.updatedBy).toBe('admin@solarium.com');
    });

    it('should reset state flags after sync', () => {
      // Set some state flags first
      store.dispatch(setLoading(true));
      store.dispatch(setError('Some error'));
      store.dispatch(
        setFeatureFlagPending({ flag: 'BETA_FEATURES', value: true })
      );

      // Sync from API
      store.dispatch(syncSettingsFromApi(mockSettings));

      const state = store.getState().settings;
      expect(state.isLoading).toBe(false);
      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe(null);
      expect(state.isDirty).toBe(false);
      expect(state.pendingUpdates.featureFlags).toEqual({});
      expect(state.lastSyncedAt).toBeTruthy();
    });
  });

  describe('Feature Flag Management', () => {
    it('should set feature flag pending state', () => {
      const initialValue = store.getState().settings.featureFlags.BETA_FEATURES;

      store.dispatch(
        setFeatureFlagPending({ flag: 'BETA_FEATURES', value: true })
      );

      const state = store.getState().settings;
      expect(state.featureFlags.BETA_FEATURES).toBe(true);
      expect(state.isDirty).toBe(true);
      expect(state.pendingUpdates.featureFlags.BETA_FEATURES).toBeDefined();
      expect(state.pendingUpdates.featureFlags.BETA_FEATURES?.value).toBe(
        initialValue
      );
    });

    it('should rollback feature flag updates', () => {
      // Set a flag to pending
      store.dispatch(
        setFeatureFlagPending({ flag: 'BETA_FEATURES', value: true })
      );
      expect(store.getState().settings.featureFlags.BETA_FEATURES).toBe(true);

      // Rollback
      store.dispatch(rollbackFeatureFlagUpdates());

      const state = store.getState().settings;
      expect(state.featureFlags.BETA_FEATURES).toBe(false); // Back to original
      expect(state.pendingUpdates.featureFlags).toEqual({});
    });

    it('should bulk update feature flags', () => {
      const updates = {
        ADVANCED_REPORTING: true,
        BETA_FEATURES: true,
        DEBUG_MODE: true,
      };

      store.dispatch(updateFeatureFlags(updates));

      const state = store.getState().settings;
      expect(state.featureFlags.ADVANCED_REPORTING).toBe(true);
      expect(state.featureFlags.BETA_FEATURES).toBe(true);
      expect(state.featureFlags.DEBUG_MODE).toBe(true);
      expect(state.isDirty).toBe(true);
    });
  });

  describe('Threshold Management', () => {
    it('should set threshold pending state', () => {
      const initialValue = store.getState().settings.thresholds.MAX_FILE_SIZE;

      store.dispatch(setThresholdPending({ key: 'MAX_FILE_SIZE', value: 25 }));

      const state = store.getState().settings;
      expect(state.thresholds.MAX_FILE_SIZE).toBe(25);
      expect(state.isDirty).toBe(true);
      expect(state.pendingUpdates.thresholds.MAX_FILE_SIZE).toBeDefined();
      expect(state.pendingUpdates.thresholds.MAX_FILE_SIZE?.value).toBe(
        initialValue
      );
    });

    it('should rollback threshold updates', () => {
      // Set a threshold to pending
      store.dispatch(setThresholdPending({ key: 'MAX_FILE_SIZE', value: 25 }));
      expect(store.getState().settings.thresholds.MAX_FILE_SIZE).toBe(25);

      // Rollback
      store.dispatch(rollbackThresholdUpdates());

      const state = store.getState().settings;
      expect(state.thresholds.MAX_FILE_SIZE).toBe(10); // Back to original
      expect(state.pendingUpdates.thresholds).toEqual({});
    });

    it('should bulk update thresholds', () => {
      const updates = {
        MAX_FILE_SIZE: 20,
        SESSION_WARNING: 8,
        API_TIMEOUT: 60,
      };

      store.dispatch(updateThresholds(updates));

      const state = store.getState().settings;
      expect(state.thresholds.MAX_FILE_SIZE).toBe(20);
      expect(state.thresholds.SESSION_WARNING).toBe(8);
      expect(state.thresholds.API_TIMEOUT).toBe(60);
      expect(state.isDirty).toBe(true);
    });
  });

  describe('Comprehensive Rollback', () => {
    it('should rollback all pending updates', () => {
      // Set multiple pending updates
      store.dispatch(
        setFeatureFlagPending({ flag: 'BETA_FEATURES', value: true })
      );
      store.dispatch(setThresholdPending({ key: 'MAX_FILE_SIZE', value: 25 }));

      expect(store.getState().settings.isDirty).toBe(true);

      // Rollback all
      store.dispatch(rollbackAllPendingUpdates());

      const state = store.getState().settings;
      expect(state.featureFlags.BETA_FEATURES).toBe(false);
      expect(state.thresholds.MAX_FILE_SIZE).toBe(10);
      expect(state.pendingUpdates.featureFlags).toEqual({});
      expect(state.pendingUpdates.thresholds).toEqual({});
      expect(state.isDirty).toBe(false);
    });

    it('should confirm pending updates', () => {
      // Set pending updates
      store.dispatch(
        setFeatureFlagPending({ flag: 'BETA_FEATURES', value: true })
      );
      store.dispatch(setThresholdPending({ key: 'MAX_FILE_SIZE', value: 25 }));

      // Confirm
      store.dispatch(confirmPendingUpdates());

      const state = store.getState().settings;
      expect(state.pendingUpdates.featureFlags).toEqual({});
      expect(state.pendingUpdates.thresholds).toEqual({});
      expect(state.isDirty).toBe(false);
    });
  });

  describe('Session Settings', () => {
    it('should update session timeout', () => {
      store.dispatch(updateSessionTimeout(60));

      const state = store.getState().settings;
      expect(state.sessionTimeoutMin).toBe(60);
      expect(state.isDirty).toBe(true);
    });

    it('should update token expiry', () => {
      store.dispatch(updateTokenExpiry(120));

      const state = store.getState().settings;
      expect(state.tokenExpiryMin).toBe(120);
      expect(state.isDirty).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to defaults', () => {
      // Modify some settings
      store.dispatch(syncSettingsFromApi(mockSettings));
      store.dispatch(
        setFeatureFlagPending({ flag: 'BETA_FEATURES', value: true })
      );

      // Reset
      store.dispatch(resetToDefaults());

      const state = store.getState().settings;
      expect(state.sessionTimeoutMin).toBe(30);
      expect(state.tokenExpiryMin).toBe(60);
      expect(state.featureFlags.ADVANCED_REPORTING).toBe(false);
      expect(state.thresholds.MAX_FILE_SIZE).toBe(10);
      expect(state.isDirty).toBe(false);
      expect(state.pendingUpdates.featureFlags).toEqual({});
      expect(state.lastSyncedAt).toBeTruthy();
    });
  });

  describe('Selectors', () => {
    beforeEach(() => {
      store.dispatch(syncSettingsFromApi(mockSettings));
    });

    it('should select feature flag correctly', () => {
      const state = store.getState() as RootState;
      const selector = selectFeatureFlag('ADVANCED_REPORTING');

      expect(selector(state)).toBe(true);
    });

    it('should return false for non-existent feature flag', () => {
      const state = store.getState() as RootState;
      const selector = selectFeatureFlag('NON_EXISTENT_FLAG');

      expect(selector(state)).toBe(false);
    });

    it('should select common feature flags', () => {
      const state = store.getState() as RootState;

      expect(selectAdvancedReporting(state)).toBe(true);
      expect(selectBetaFeatures(state)).toBe(false);
    });

    it('should select threshold correctly', () => {
      const state = store.getState() as RootState;
      const selector = selectThreshold('MAX_FILE_SIZE');

      expect(selector(state)).toBe(15);
    });

    it('should return 0 for non-existent threshold', () => {
      const state = store.getState() as RootState;
      const selector = selectThreshold('NON_EXISTENT_THRESHOLD');

      expect(selector(state)).toBe(0);
    });

    it('should select common thresholds', () => {
      const state = store.getState() as RootState;

      expect(selectMaxFileSize(state)).toBe(15);
    });

    it('should detect pending updates', () => {
      store.dispatch(
        setFeatureFlagPending({ flag: 'BETA_FEATURES', value: true })
      );

      const state = store.getState() as RootState;
      expect(selectHasPendingUpdates(state)).toBe(true);
    });

    it('should create settings summary', () => {
      store.dispatch(
        setFeatureFlagPending({ flag: 'BETA_FEATURES', value: true })
      );

      const state = store.getState() as RootState;
      const summary = selectSettingsSummary(state);

      expect(summary.sessionTimeout).toBe(45);
      expect(summary.tokenExpiry).toBe(90);
      expect(summary.enabledFlags).toContain('ADVANCED_REPORTING');
      expect(summary.thresholdCount).toBe(6);
      expect(summary.isDirty).toBe(true);
      expect(summary.hasPending).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle error state correctly', () => {
      store.dispatch(setError('Network error'));

      const state = store.getState().settings;
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
      expect(state.isUpdating).toBe(false);
    });

    it('should clear error state', () => {
      store.dispatch(setError('Network error'));
      store.dispatch(clearError());

      expect(store.getState().settings.error).toBe(null);
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistency during complex operations', () => {
      // Complex sequence of operations
      store.dispatch(syncSettingsFromApi(mockSettings));
      store.dispatch(
        setFeatureFlagPending({ flag: 'BETA_FEATURES', value: true })
      );
      store.dispatch(setThresholdPending({ key: 'MAX_FILE_SIZE', value: 25 }));
      store.dispatch(updateSessionTimeout(75));

      const state = store.getState().settings;

      // Verify optimistic updates are applied
      expect(state.featureFlags.BETA_FEATURES).toBe(true);
      expect(state.thresholds.MAX_FILE_SIZE).toBe(25);
      expect(state.sessionTimeoutMin).toBe(75);
      expect(state.isDirty).toBe(true);

      // Verify pending tracking
      expect(Object.keys(state.pendingUpdates.featureFlags)).toHaveLength(1);
      expect(Object.keys(state.pendingUpdates.thresholds)).toHaveLength(1);

      // Rollback and verify consistency
      store.dispatch(rollbackAllPendingUpdates());

      const finalState = store.getState().settings;
      expect(finalState.featureFlags.BETA_FEATURES).toBe(false);
      expect(finalState.thresholds.MAX_FILE_SIZE).toBe(15); // Original from API sync
      expect(finalState.sessionTimeoutMin).toBe(75); // Not rolled back (not pending)
      expect(finalState.isDirty).toBe(true); // Still dirty due to session timeout change
    });
  });
});
