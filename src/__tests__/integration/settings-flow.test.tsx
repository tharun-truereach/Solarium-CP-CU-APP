/**
 * End-to-End Settings Integration Tests
 * Tests complete user flows for settings management functionality
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

import { theme } from '../../theme';
import { apiSlice } from '../../api/apiSlice';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import settingsSlice from '../../store/slices/settingsSlice';
import AppRoutes from '../../routes/AppRoutes';
import type { User } from '../../types/user.types';
import type {
  SystemSettings,
  SettingsAuditLog,
} from '../../types/settings.types';

// Mock admin user
const mockAdminUser: User = {
  id: 'admin-123',
  email: 'admin@solarium.com',
  name: 'Admin User',
  role: 'admin',
  permissions: ['settings:read', 'settings:write'],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock settings data
let currentMockSettings: SystemSettings = {
  sessionTimeoutMin: 30,
  tokenExpiryMin: 60,
  featureFlags: {
    ADVANCED_REPORTING: false,
    ANALYTICS: true,
    DEBUG_MODE: false,
    BULK_OPERATIONS: true,
  },
  thresholds: {
    MAX_LEADS_PER_PAGE: 50,
    SESSION_WARNING_MIN: 5,
    MAX_FILE_SIZE_MB: 10,
  },
  lastUpdated: '2024-01-15T10:00:00Z',
  updatedBy: 'admin@solarium.com',
};

// Mock audit logs
const mockAuditLogs: SettingsAuditLog[] = [];

// MSW server for E2E testing
const server = setupServer(
  // Login endpoint
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: mockAdminUser,
        token: 'admin-token',
        refreshToken: 'admin-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    );
  }),

  // Settings endpoints
  rest.get('/api/v1/settings', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(currentMockSettings));
  }),

  rest.patch('/api/v1/settings', async (req, res, ctx) => {
    const updates = await req.json();
    const timestamp = new Date().toISOString();

    // Create audit entries for changes
    if (updates.featureFlags) {
      Object.entries(updates.featureFlags).forEach(([flag, newValue]) => {
        const oldValue = (currentMockSettings.featureFlags as any)[flag];
        if (oldValue !== newValue) {
          mockAuditLogs.unshift({
            id: String(Date.now() + Math.random()),
            userId: 'admin-123',
            userName: 'Admin User',
            field: `featureFlags.${flag}`,
            oldValue,
            newValue,
            timestamp,
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Test)',
          });
        }
      });
    }

    if (
      updates.sessionTimeoutMin !== undefined &&
      updates.sessionTimeoutMin !== currentMockSettings.sessionTimeoutMin
    ) {
      mockAuditLogs.unshift({
        id: String(Date.now() + Math.random()),
        userId: 'admin-123',
        userName: 'Admin User',
        field: 'sessionTimeoutMin',
        oldValue: currentMockSettings.sessionTimeoutMin,
        newValue: updates.sessionTimeoutMin,
        timestamp,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Test)',
      });
    }

    // Update current settings
    currentMockSettings = {
      ...currentMockSettings,
      ...updates,
      lastUpdated: timestamp,
      updatedBy: 'admin@solarium.com',
    };

    return res(ctx.status(200), ctx.json(currentMockSettings));
  }),

  // Audit logs endpoint
  rest.get('/api/v1/settings/audit', (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');

    return res(
      ctx.status(200),
      ctx.json({
        logs: mockAuditLogs.slice(0, limit),
        total: mockAuditLogs.length,
        page,
        limit,
        totalPages: Math.ceil(mockAuditLogs.length / limit),
      })
    );
  }),

  // Dashboard endpoint
  rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        activeLeads: 25,
        pendingQuotations: 8,
        channelPartners: 12,
        pendingCommissions: 3,
        recentActivities: [],
      })
    );
  })
);

// Test store factory
const createTestStore = (
  user: User | null = null,
  token: string | null = null
) => {
  const preloadedState = {
    auth: {
      user,
      token,
      refreshToken: token ? 'refresh-token' : null,
      expiresAt: token ? new Date(Date.now() + 3600000).toISOString() : null,
      isLoading: false,
      isAuthenticated: !!token,
      lastActivity: token ? new Date().toISOString() : null,
      loginTimestamp: token ? new Date().toISOString() : null,
      sessionWarningShown: false,
      error: null,
      loginAttempts: 0,
      lockoutUntil: null,
      rememberMe: false,
      twoFactorRequired: false,
      twoFactorToken: null,
    },
    ui: {
      isGlobalLoading: false,
      toasts: [],
      errorToast: { show: false, message: '', action: null },
      modals: {},
      sidebarOpen: true,
      sidebarCollapsed: false,
      darkMode: false,
    },
    settings: {
      ...currentMockSettings,
      isLoading: false,
      isUpdating: false,
      error: null,
      pendingUpdates: {
        featureFlags: {},
        thresholds: {},
      },
      lastSyncedAt: null,
      isDirty: false,
    },
  };

  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
      settings: settingsSlice,
      api: apiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: preloadedState as any,
  });
};

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode;
  initialRoute?: string;
  store?: any;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  initialRoute = '/login',
  store = createTestStore(),
}) => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('Settings E2E Integration Tests', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    // Reset mock data
    currentMockSettings = {
      sessionTimeoutMin: 30,
      tokenExpiryMin: 60,
      featureFlags: {
        ADVANCED_REPORTING: false,
        ANALYTICS: true,
        DEBUG_MODE: false,
        BULK_OPERATIONS: true,
      },
      thresholds: {
        MAX_LEADS_PER_PAGE: 50,
        SESSION_WARNING_MIN: 5,
        MAX_FILE_SIZE_MB: 10,
      },
      lastUpdated: '2024-01-15T10:00:00Z',
      updatedBy: 'admin@solarium.com',
    };
    mockAuditLogs.length = 0; // Clear audit logs
  });
  afterAll(() => server.close());

  describe('Complete Admin Settings Flow', () => {
    it('should complete full E2E flow: login → navigate → toggle feature flag → verify audit', async () => {
      const user = userEvent.setup();

      // Start with login page
      render(
        <TestWrapper initialRoute="/login">
          <AppRoutes />
        </TestWrapper>
      );

      // Step 1: Verify login page
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /sign in/i })
        ).toBeInTheDocument();
      });

      // Step 2: Login as admin (simulate successful login by navigating to dashboard)
      const store = createTestStore(mockAdminUser, 'admin-token');

      render(
        <TestWrapper initialRoute="/dashboard" store={store}>
          <AppRoutes />
        </TestWrapper>
      );

      // Step 3: Verify dashboard loads
      await waitFor(() => {
        expect(
          screen.getByText('Welcome back, Admin User!')
        ).toBeInTheDocument();
      });

      // Step 4: Navigate to settings
      const settingsLink = screen.getByText('Settings');
      await user.click(settingsLink);

      // Step 5: Verify settings page loads
      await waitFor(() => {
        expect(screen.getByText('System Settings')).toBeInTheDocument();
      });

      // Step 6: Wait for settings data to load
      await waitFor(
        () => {
          expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Step 7: Navigate to Feature Flags tab
      const featureFlagsTab = screen.getByRole('tab', {
        name: /feature flags/i,
      });
      await user.click(featureFlagsTab);

      // Step 8: Wait for feature flags content
      await waitFor(() => {
        expect(screen.getByText('ADVANCED_REPORTING')).toBeInTheDocument();
      });

      // Step 9: Toggle ADVANCED_REPORTING feature flag
      const advancedReportingSwitch = screen.getByRole('switch', {
        name: /advanced_reporting/i,
      });

      // Verify initial state (should be false)
      expect(advancedReportingSwitch).not.toBeChecked();

      // Toggle the switch
      await user.click(advancedReportingSwitch);

      // Step 10: Verify optimistic update (immediate UI response)
      await waitFor(() => {
        expect(advancedReportingSwitch).toBeChecked();
      });

      // Step 11: Wait for server update to complete
      await waitFor(
        () => {
          expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Step 12: Navigate to Audit Log tab
      const auditLogTab = screen.getByRole('tab', { name: /audit log/i });
      await user.click(auditLogTab);

      // Step 13: Verify audit entry appears
      await waitFor(
        () => {
          expect(
            screen.getByText('featureFlags.ADVANCED_REPORTING')
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Step 14: Verify audit entry details
      const auditTable = screen.getByRole('table', {
        name: /audit log table/i,
      });
      expect(auditTable).toBeInTheDocument();

      // Check audit entry content
      within(auditTable).getByText('Admin User');
      within(auditTable).getByText('false'); // Old value
      within(auditTable).getByText('true'); // New value

      console.log(
        '✅ E2E Flow Complete: Admin logged in, toggled feature flag, verified audit entry'
      );
    });

    it('should handle numeric settings update with validation', async () => {
      const user = userEvent.setup();
      const store = createTestStore(mockAdminUser, 'admin-token');

      render(
        <TestWrapper initialRoute="/settings" store={store}>
          <AppRoutes />
        </TestWrapper>
      );

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByText('System Settings')).toBeInTheDocument();
      });

      // Navigate to General tab
      const generalTab = screen.getByRole('tab', { name: /general/i });
      await user.click(generalTab);

      // Find and update session timeout
      await waitFor(() => {
        const sessionTimeoutInput = screen.getByDisplayValue('30');
        expect(sessionTimeoutInput).toBeInTheDocument();
      });

      const sessionTimeoutInput = screen.getByDisplayValue('30');

      // Update session timeout
      await user.clear(sessionTimeoutInput);
      await user.type(sessionTimeoutInput, '45');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify success
      await waitFor(() => {
        expect(screen.getByText(/settings saved/i)).toBeInTheDocument();
      });

      // Verify audit log
      const auditLogTab = screen.getByRole('tab', { name: /audit log/i });
      await user.click(auditLogTab);

      await waitFor(() => {
        expect(screen.getByText('sessionTimeoutMin')).toBeInTheDocument();
      });
    });
  });

  describe('Feature Flag Context Integration', () => {
    it('should propagate feature flag changes to other components', async () => {
      const user = userEvent.setup();
      const store = createTestStore(mockAdminUser, 'admin-token');

      render(
        <TestWrapper initialRoute="/settings" store={store}>
          <AppRoutes />
        </TestWrapper>
      );

      // Navigate to feature flags
      await waitFor(() => {
        const featureFlagsTab = screen.getByRole('tab', {
          name: /feature flags/i,
        });
        fireEvent.click(featureFlagsTab);
      });

      // Toggle analytics flag
      await waitFor(() => {
        const analyticsSwitch = screen.getByRole('switch', {
          name: /analytics/i,
        });
        expect(analyticsSwitch).toBeChecked(); // Initially true
        fireEvent.click(analyticsSwitch);
      });

      // Verify flag is updated
      await waitFor(() => {
        const analyticsSwitch = screen.getByRole('switch', {
          name: /analytics/i,
        });
        expect(analyticsSwitch).not.toBeChecked();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      server.use(
        rest.patch('/api/v1/settings', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ message: 'Internal server error' })
          );
        })
      );

      const user = userEvent.setup();
      const store = createTestStore(mockAdminUser, 'admin-token');

      render(
        <TestWrapper initialRoute="/settings" store={store}>
          <AppRoutes />
        </TestWrapper>
      );

      // Navigate to feature flags
      await waitFor(() => {
        const featureFlagsTab = screen.getByRole('tab', {
          name: /feature flags/i,
        });
        fireEvent.click(featureFlagsTab);
      });

      // Try to toggle flag (should fail)
      await waitFor(() => {
        const switch1 = screen.getByRole('switch', {
          name: /advanced_reporting/i,
        });
        fireEvent.click(switch1);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Should rollback optimistic update
      await waitFor(() => {
        const switch1 = screen.getByRole('switch', {
          name: /advanced_reporting/i,
        });
        expect(switch1).not.toBeChecked();
      });
    });
  });

  describe('Access Control Integration', () => {
    it('should enforce admin-only access across the flow', async () => {
      const kamUser: User = {
        ...mockAdminUser,
        id: 'kam-456',
        role: 'kam',
        permissions: ['leads:read'],
      };

      const store = createTestStore(kamUser, 'kam-token');

      render(
        <TestWrapper initialRoute="/settings" store={store}>
          <AppRoutes />
        </TestWrapper>
      );

      // Should redirect to access denied
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      // Should not show settings content
      expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
    });
  });
});
