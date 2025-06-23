/**
 * Feature Flags Hook
 * Convenience hook for accessing feature flags without context
 */

import { useContext } from 'react';
import {
  FeatureFlagProvider,
  useFeatureFlags as useFeatureFlagsContext,
  useFeatureFlag as useFeatureFlagContext,
} from '../contexts/FeatureFlagContext';
import type { FeatureFlags } from '../types/settings.types';

/**
 * Main feature flags hook
 * Re-exports the context hook for convenience
 */
export const useFeatureFlags = useFeatureFlagsContext;

/**
 * Individual feature flag hook
 * Re-exports the context hook for convenience
 */
export const useFeatureFlag = useFeatureFlagContext;

/**
 * Hook for specific commonly used feature flags
 * Provides strongly typed access to known flags
 */
export const useCommonFeatureFlags = () => {
  const { isEnabled } = useFeatureFlags();

  return {
    // Core features
    advancedReporting: isEnabled('ADVANCED_REPORTING'),
    bulkOperations: isEnabled('BULK_OPERATIONS'),

    // UI features
    darkMode: isEnabled('DARK_MODE'),

    // Experimental features
    betaFeatures: isEnabled('BETA_FEATURES'),
    debugMode: isEnabled('DEBUG_MODE'),

    // Analytics
    analytics: isEnabled('ANALYTICS'),
  };
};

/**
 * Hook that returns feature flag state and helpers
 */
export const useFeatureFlagState = () => {
  const context = useFeatureFlags();

  return {
    ...context,
    // Helper methods
    isAnyEnabled: (flags: string[]) =>
      flags.some(flag => context.isEnabled(flag)),
    areAllEnabled: (flags: string[]) =>
      flags.every(flag => context.isEnabled(flag)),
    getEnabledFlags: () =>
      Object.entries(context.flags)
        .filter(([, enabled]) => enabled)
        .map(([flag]) => flag),
    getDisabledFlags: () =>
      Object.entries(context.flags)
        .filter(([, enabled]) => !enabled)
        .map(([flag]) => flag),
  };
};

export default useFeatureFlags;
