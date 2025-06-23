/**
 * Feature Flag Context Provider
 * Provides real-time feature flag state propagation across the application
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectFeatureFlags } from '../store/slices/settingsSlice';
import type { FeatureFlags } from '../types/settings.types';

/**
 * Feature flag context interface
 */
interface FeatureFlagContextValue {
  flags: FeatureFlags;
  isEnabled: (flag: string) => boolean;
  hasFlags: boolean;
  lastUpdated: string | null;
  flagCount: number;
  enabledCount: number;
}

/**
 * Create the context
 */
const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

/**
 * Context provider props
 */
interface FeatureFlagProviderProps {
  children: React.ReactNode;
}

/**
 * Feature Flag Context Provider Component
 * Subscribes to Redux settings slice and provides real-time flag updates
 */
export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  children,
}) => {
  // Subscribe to feature flags from Redux store
  const flags = useAppSelector(selectFeatureFlags);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Update timestamp when flags change
  useEffect(() => {
    setLastUpdated(new Date().toISOString());

    // Log flag changes in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚩 Feature flags updated:', {
        flags,
        enabledCount: Object.values(flags).filter(Boolean).length,
        totalCount: Object.keys(flags).length,
        timestamp: new Date().toISOString(),
      });
    }
  }, [flags]);

  /**
   * Check if a specific flag is enabled
   */
  const isEnabled = (flag: string): boolean => {
    return flags[flag] ?? false;
  };

  /**
   * Calculate derived values
   */
  const hasFlags = Object.keys(flags).length > 0;
  const flagCount = Object.keys(flags).length;
  const enabledCount = Object.values(flags).filter(Boolean).length;

  const contextValue: FeatureFlagContextValue = {
    flags,
    isEnabled,
    hasFlags,
    lastUpdated,
    flagCount,
    enabledCount,
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

/**
 * Hook to use feature flags context
 * @throws Error if used outside of FeatureFlagProvider
 */
export const useFeatureFlags = (): FeatureFlagContextValue => {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error(
      'useFeatureFlags must be used within a FeatureFlagProvider'
    );
  }

  return context;
};

/**
 * Higher-order component for feature flag conditional rendering
 */
interface WithFeatureFlagProps {
  flag: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const WithFeatureFlag: React.FC<WithFeatureFlagProps> = ({
  flag,
  fallback = null,
  children,
}) => {
  const { isEnabled } = useFeatureFlags();

  return isEnabled(flag) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook for individual feature flag with memoization
 */
export const useFeatureFlag = (flag: string): boolean => {
  const { isEnabled } = useFeatureFlags();

  // Memoize the result to prevent unnecessary re-renders
  const [isEnabledValue, setIsEnabledValue] = useState(() => isEnabled(flag));

  useEffect(() => {
    const newValue = isEnabled(flag);
    if (newValue !== isEnabledValue) {
      setIsEnabledValue(newValue);

      // Log individual flag changes in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚩 Feature flag '${flag}' changed:`, {
          flag,
          from: isEnabledValue,
          to: newValue,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }, [flag, isEnabled, isEnabledValue]);

  return isEnabledValue;
};

/**
 * Hook for multiple feature flags
 */
export const useFeatureFlagsMultiple = (
  flagNames: string[]
): Record<string, boolean> => {
  const { flags } = useFeatureFlags();

  // Memoize the result to prevent unnecessary re-renders
  const [flagValues, setFlagValues] = useState(() =>
    flagNames.reduce(
      (acc, flag) => {
        acc[flag] = flags[flag] ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    )
  );

  useEffect(() => {
    const newValues = flagNames.reduce(
      (acc, flag) => {
        acc[flag] = flags[flag] ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    );

    // Check if any values changed
    const hasChanged = flagNames.some(
      flag => newValues[flag] !== flagValues[flag]
    );

    if (hasChanged) {
      setFlagValues(newValues);

      // Log multiple flag changes in development
      if (process.env.NODE_ENV === 'development') {
        const changes = flagNames
          .filter(flag => newValues[flag] !== flagValues[flag])
          .map(flag => `${flag}: ${flagValues[flag]} → ${newValues[flag]}`)
          .join(', ');

        console.log('🚩 Multiple feature flags changed:', {
          changes,
          flagNames,
          newValues,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }, [flags, flagNames, flagValues]);

  return flagValues;
};

/**
 * Custom hook for feature flag analytics (optional)
 */
export const useFeatureFlagAnalytics = () => {
  const { flags, enabledCount, flagCount, lastUpdated } = useFeatureFlags();

  const analytics = {
    totalFlags: flagCount,
    enabledFlags: enabledCount,
    disabledFlags: flagCount - enabledCount,
    enabledPercentage:
      flagCount > 0 ? Math.round((enabledCount / flagCount) * 100) : 0,
    lastUpdated,
    flagsByCategory: {
      core: Object.keys(flags).filter(key =>
        ['ADVANCED_REPORTING', 'BULK_OPERATIONS'].includes(key)
      ).length,
      experimental: Object.keys(flags).filter(key =>
        ['BETA_FEATURES', 'DEBUG_MODE'].includes(key)
      ).length,
      ui: Object.keys(flags).filter(key => ['DARK_MODE'].includes(key)).length,
      analytics: Object.keys(flags).filter(key => ['ANALYTICS'].includes(key))
        .length,
    },
  };

  return analytics;
};

/**
 * React component for debugging feature flags (development only)
 */
export const FeatureFlagDebugger: React.FC = () => {
  const { flags, enabledCount, flagCount, lastUpdated } = useFeatureFlags();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        Feature Flags: {enabledCount}/{flagCount}
      </div>
      {Object.entries(flags).map(([key, value]) => (
        <div
          key={key}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            minWidth: '200px',
          }}
        >
          <span>{key}:</span>
          <span style={{ color: value ? '#4caf50' : '#f44336' }}>
            {value ? 'ON' : 'OFF'}
          </span>
        </div>
      ))}
      {lastUpdated && (
        <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
          Updated: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default FeatureFlagContext;
