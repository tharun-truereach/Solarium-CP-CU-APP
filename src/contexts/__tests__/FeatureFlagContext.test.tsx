/**
 * Feature Flag Context Tests
 * Tests real-time feature flag propagation and context functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  FeatureFlagProvider,
  useFeatureFlags,
  useFeatureFlag,
  WithFeatureFlag,
  FeatureFlagDebugger,
} from '../FeatureFlagContext';
import settingsSlice, {
  syncSettingsFromApi,
} from '../../store/slices/settingsSlice';
import type { SystemSettings } from '../../types/settings.types';

// Mock settings data
const mockSettings: SystemSettings = {
  sessionTimeoutMin: 30,
  tokenExpiryMin: 60,
  featureFlags: {
    ANALYTICS: true,
    BETA_FEATURES: false,
    DARK_MODE: true,
    DEBUG_MODE: false,
    ADVANCED_REPORTING: true,
    BULK_OPERATIONS: false,
  },
  thresholds: {
    MAX_FILE_SIZE: 10,
    SESSION_WARNING: 5,
    API_TIMEOUT: 30,
  },
  lastUpdated: '2024-01-15T10:30:00Z',
  updatedBy: 'admin@solarium.com',
};

// Create test store
const createTestStore = (initialSettings?: SystemSettings) => {
  const store = configureStore({
    reducer: {
      settings: settingsSlice,
    },
  });

  if (initialSettings) {
    store.dispatch(syncSettingsFromApi(initialSettings));
  }

  return store;
};

// Test component that uses feature flags
const TestComponent: React.FC = () => {
  const { flags, isEnabled, enabledCount, flagCount, lastUpdated, hasFlags } =
    useFeatureFlags();

  return (
    <div>
      <div data-testid="flag-count">{flagCount}</div>
      <div data-testid="enabled-count">{enabledCount}</div>
      <div data-testid="has-flags">{hasFlags.toString()}</div>
      <div data-testid="analytics-enabled">
        {isEnabled('ANALYTICS').toString()}
      </div>
      <div data-testid="beta-enabled">
        {isEnabled('BETA_FEATURES').toString()}
      </div>
      <div data-testid="last-updated">{lastUpdated}</div>
      <div data-testid="all-flags">{JSON.stringify(flags)}</div>
    </div>
  );
};

// Test component using individual flag hook
const IndividualFlagComponent: React.FC<{ flag: string }> = ({ flag }) => {
  const isEnabled = useFeatureFlag(flag);

  return (
    <div data-testid={`individual-${flag.toLowerCase()}`}>
      {isEnabled.toString()}
    </div>
  );
};

// Test wrapper
const TestWrapper: React.FC<{
  children: React.ReactNode;
  initialSettings?: SystemSettings;
}> = ({ children, initialSettings }) => {
  const store = createTestStore(initialSettings);

  return (
    <Provider store={store}>
      <FeatureFlagProvider>{children}</FeatureFlagProvider>
    </Provider>
  );
};

describe('FeatureFlagContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn(); // Mock console.log to avoid test noise
  });

  describe('FeatureFlagProvider', () => {
    it('should provide feature flags from Redux store', () => {
      render(
        <TestWrapper initialSettings={mockSettings}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('flag-count')).toHaveTextContent('6');
      expect(screen.getByTestId('enabled-count')).toHaveTextContent('3');
      expect(screen.getByTestId('has-flags')).toHaveTextContent('true');
      expect(screen.getByTestId('analytics-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('beta-enabled')).toHaveTextContent('false');
    });

    it('should handle empty flags gracefully', () => {
      const emptySettings = {
        ...mockSettings,
        featureFlags: {},
      };

      render(
        <TestWrapper initialSettings={emptySettings}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('flag-count')).toHaveTextContent('0');
      expect(screen.getByTestId('enabled-count')).toHaveTextContent('0');
      expect(screen.getByTestId('has-flags')).toHaveTextContent('false');
    });

    it('should update when Redux state changes', async () => {
      const store = createTestStore(mockSettings);

      render(
        <Provider store={store}>
          <FeatureFlagProvider>
            <TestComponent />
          </FeatureFlagProvider>
        </Provider>
      );

      // Initial state
      expect(screen.getByTestId('analytics-enabled')).toHaveTextContent('true');

      // Update settings
      const updatedSettings = {
        ...mockSettings,
        featureFlags: {
          ...mockSettings.featureFlags,
          ANALYTICS: false,
          BETA_FEATURES: true,
        },
      };

      act(() => {
        store.dispatch(syncSettingsFromApi(updatedSettings));
      });

      // Should reflect new state
      await waitFor(() => {
        expect(screen.getByTestId('analytics-enabled')).toHaveTextContent(
          'false'
        );
        expect(screen.getByTestId('beta-enabled')).toHaveTextContent('true');
      });
    });

    it('should update lastUpdated timestamp when flags change', async () => {
      const store = createTestStore(mockSettings);

      render(
        <Provider store={store}>
          <FeatureFlagProvider>
            <TestComponent />
          </FeatureFlagProvider>
        </Provider>
      );

      const initialTimestamp = screen.getByTestId('last-updated').textContent;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update settings
      act(() => {
        store.dispatch(
          syncSettingsFromApi({
            ...mockSettings,
            featureFlags: {
              ...mockSettings.featureFlags,
              ANALYTICS: false,
            },
          })
        );
      });

      await waitFor(() => {
        const newTimestamp = screen.getByTestId('last-updated').textContent;
        expect(newTimestamp).not.toBe(initialTimestamp);
      });
    });
  });

  describe('useFeatureFlags hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useFeatureFlags must be used within a FeatureFlagProvider');

      console.error = originalError;
    });

    it('should provide isEnabled function', () => {
      render(
        <TestWrapper initialSettings={mockSettings}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('analytics-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('beta-enabled')).toHaveTextContent('false');
    });

    it('should return false for non-existent flags', () => {
      const TestNonExistentFlag: React.FC = () => {
        const { isEnabled } = useFeatureFlags();
        return (
          <div data-testid="non-existent">
            {isEnabled('NON_EXISTENT_FLAG').toString()}
          </div>
        );
      };

      render(
        <TestWrapper initialSettings={mockSettings}>
          <TestNonExistentFlag />
        </TestWrapper>
      );

      expect(screen.getByTestId('non-existent')).toHaveTextContent('false');
    });
  });

  describe('useFeatureFlag hook', () => {
    it('should return correct flag value', () => {
      render(
        <TestWrapper initialSettings={mockSettings}>
          <IndividualFlagComponent flag="ANALYTICS" />
          <IndividualFlagComponent flag="BETA_FEATURES" />
        </TestWrapper>
      );

      expect(screen.getByTestId('individual-analytics')).toHaveTextContent(
        'true'
      );
      expect(screen.getByTestId('individual-beta_features')).toHaveTextContent(
        'false'
      );
    });

    it('should update when specific flag changes', async () => {
      const store = createTestStore(mockSettings);

      render(
        <Provider store={store}>
          <FeatureFlagProvider>
            <IndividualFlagComponent flag="ANALYTICS" />
          </FeatureFlagProvider>
        </Provider>
      );

      // Initial state
      expect(screen.getByTestId('individual-analytics')).toHaveTextContent(
        'true'
      );

      // Update flag
      act(() => {
        store.dispatch(
          syncSettingsFromApi({
            ...mockSettings,
            featureFlags: {
              ...mockSettings.featureFlags,
              ANALYTICS: false,
            },
          })
        );
      });

      // Should reflect new state
      await waitFor(() => {
        expect(screen.getByTestId('individual-analytics')).toHaveTextContent(
          'false'
        );
      });
    });
  });

  describe('WithFeatureFlag component', () => {
    it('should render children when flag is enabled', () => {
      render(
        <TestWrapper initialSettings={mockSettings}>
          <WithFeatureFlag flag="ANALYTICS">
            <div data-testid="analytics-content">Analytics Content</div>
          </WithFeatureFlag>
        </TestWrapper>
      );

      expect(screen.getByTestId('analytics-content')).toBeInTheDocument();
    });

    it('should not render children when flag is disabled', () => {
      render(
        <TestWrapper initialSettings={mockSettings}>
          <WithFeatureFlag flag="BETA_FEATURES">
            <div data-testid="beta-content">Beta Content</div>
          </WithFeatureFlag>
        </TestWrapper>
      );

      expect(screen.queryByTestId('beta-content')).not.toBeInTheDocument();
    });

    it('should render fallback when flag is disabled', () => {
      render(
        <TestWrapper initialSettings={mockSettings}>
          <WithFeatureFlag
            flag="BETA_FEATURES"
            fallback={<div data-testid="fallback">Fallback Content</div>}
          >
            <div data-testid="beta-content">Beta Content</div>
          </WithFeatureFlag>
        </TestWrapper>
      );

      expect(screen.queryByTestId('beta-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('should update when flag changes', async () => {
      const store = createTestStore(mockSettings);

      render(
        <Provider store={store}>
          <FeatureFlagProvider>
            <WithFeatureFlag flag="ANALYTICS">
              <div data-testid="analytics-content">Analytics Content</div>
            </WithFeatureFlag>
          </FeatureFlagProvider>
        </Provider>
      );

      // Initially visible
      expect(screen.getByTestId('analytics-content')).toBeInTheDocument();

      // Disable flag
      act(() => {
        store.dispatch(
          syncSettingsFromApi({
            ...mockSettings,
            featureFlags: {
              ...mockSettings.featureFlags,
              ANALYTICS: false,
            },
          })
        );
      });

      // Should be hidden
      await waitFor(() => {
        expect(
          screen.queryByTestId('analytics-content')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('FeatureFlagDebugger', () => {
    it('should render in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <TestWrapper initialSettings={mockSettings}>
          <FeatureFlagDebugger />
        </TestWrapper>
      );

      expect(screen.getByText(/Feature Flags: 3\/6/)).toBeInTheDocument();
      expect(screen.getByText('ANALYTICS:')).toBeInTheDocument();
      expect(screen.getByText('ON')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not render in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <TestWrapper initialSettings={mockSettings}>
          <FeatureFlagDebugger />
        </TestWrapper>
      );

      expect(screen.queryByText(/Feature Flags:/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Real-time Updates', () => {
    it('should propagate flag changes immediately across all consumers', async () => {
      const store = createTestStore(mockSettings);

      render(
        <Provider store={store}>
          <FeatureFlagProvider>
            <TestComponent />
            <IndividualFlagComponent flag="ANALYTICS" />
            <WithFeatureFlag flag="ANALYTICS">
              <div data-testid="conditional-content">Conditional Content</div>
            </WithFeatureFlag>
          </FeatureFlagProvider>
        </Provider>
      );

      // Initial state - all should show ANALYTICS as enabled
      expect(screen.getByTestId('analytics-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('individual-analytics')).toHaveTextContent(
        'true'
      );
      expect(screen.getByTestId('conditional-content')).toBeInTheDocument();

      // Disable ANALYTICS flag
      act(() => {
        store.dispatch(
          syncSettingsFromApi({
            ...mockSettings,
            featureFlags: {
              ...mockSettings.featureFlags,
              ANALYTICS: false,
            },
          })
        );
      });

      // All consumers should update immediately
      await waitFor(() => {
        expect(screen.getByTestId('analytics-enabled')).toHaveTextContent(
          'false'
        );
        expect(screen.getByTestId('individual-analytics')).toHaveTextContent(
          'false'
        );
        expect(
          screen.queryByTestId('conditional-content')
        ).not.toBeInTheDocument();
      });
    });

    it('should log flag changes in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      const consoleSpy = vi.fn();
      process.env.NODE_ENV = 'development';
      console.log = consoleSpy;

      const store = createTestStore(mockSettings);

      render(
        <Provider store={store}>
          <FeatureFlagProvider>
            <TestComponent />
          </FeatureFlagProvider>
        </Provider>
      );

      // Update flags
      act(() => {
        store.dispatch(
          syncSettingsFromApi({
            ...mockSettings,
            featureFlags: {
              ...mockSettings.featureFlags,
              ANALYTICS: false,
            },
          })
        );
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('🚩 Feature flags updated:'),
          expect.any(Object)
        );
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
});
