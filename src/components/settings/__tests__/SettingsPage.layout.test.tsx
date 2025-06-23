/**
 * Settings Page Layout Tests
 * Tests the settings page scaffold structure, tabs, and loading states
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
} from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import SettingsPage from '../../../pages/settings/SettingsPage';
import authSlice from '../../../store/slices/authSlice';
import uiSlice from '../../../store/slices/uiSlice';
import settingsSlice from '../../../store/slices/settingsSlice';
import { apiSlice } from '../../../api/apiSlice';
import type { User } from '../../../types/user.types';
import type { SystemSettings } from '../../../types/settings.types';

// Mock the AuthContext hook
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../../contexts/AuthContext';

// Mock theme
const mockTheme = {
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    text: { primary: '#000', secondary: '#666' },
    background: { paper: '#fff' },
    action: { hover: 'rgba(0, 0, 0, 0.04)', selected: 'rgba(0, 0, 0, 0.08)' },
    divider: '#e0e0e0',
  },
  breakpoints: {
    down: () => '(max-width: 768px)',
  },
  transitions: {
    create: () => 'all 0.2s ease-in-out',
  },
} as any;

// Mock user
const adminUser: User = {
  id: '1',
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

const kamUser: User = {
  id: '2',
  email: 'kam@solarium.com',
  name: 'KAM User',
  role: 'kam',
  permissions: ['leads:read'],
  territories: ['North'],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock settings data
const mockSettings: SystemSettings = {
  sessionTimeoutMin: 30,
  tokenExpiryMin: 60,
  featureFlags: {
    ADVANCED_REPORTING: true,
    BETA_FEATURES: false,
    DARK_MODE: true,
    ANALYTICS: false,
  },
  thresholds: {
    MAX_FILE_SIZE: 10,
    SESSION_WARNING: 5,
    API_TIMEOUT: 30,
  },
  lastUpdated: '2024-01-15T10:30:00Z',
  updatedBy: 'admin@solarium.com',
};

// MSW server setup
const server = setupServer(
  rest.get('/api/v1/settings', (req, res, ctx) => {
    return res(ctx.json(mockSettings));
  }),
  rest.get('/api/v1/settings/error', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ message: 'Server error' }));
  })
);

// Create test store
const createTestStore = (user: User | null = null) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
      settings: settingsSlice,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    preloadedState: {
      auth: {
        user,
        token: user ? 'mock-token' : null,
        refreshToken: null,
        expiresAt: null,
        isLoading: false,
        isAuthenticated: !!user,
        lastActivity: null,
        loginTimestamp: null,
        sessionWarningShown: false,
        error: null,
        loginAttempts: 0,
        lockoutUntil: null,
        rememberMe: false,
        twoFactorRequired: false,
        twoFactorToken: null,
      },
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }).concat(apiSlice.middleware),
  });
};

// Test wrapper
const TestWrapper: React.FC<{
  children: React.ReactNode;
  user?: User | null;
}> = ({ children, user = adminUser }) => {
  const store = createTestStore(user);

  return (
    <Provider store={store}>
      <ThemeProvider theme={mockTheme}>
        <MemoryRouter>{children}</MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

// Complete AuthContext mock
const createAuthMock = (user: User | null = null) => ({
  user,
  token: user ? 'mock-token' : null,
  isAuthenticated: !!user,
  isLoading: false,
  error: null,
  sessionStatus: {
    isAuthenticated: !!user,
    isTokenExpired: false,
    isAccountLocked: false,
    timeRemaining: 3600,
    isActive: !!user,
    needsWarning: false,
  },
  loginAttempts: 0,
  isAccountLocked: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  updateProfile: vi.fn(),
  checkPermission: vi.fn(),
  checkRole: vi.fn(),
  clearError: vi.fn(),
  updateUserActivity: vi.fn(),
  showSessionExpiredWarning: vi.fn(),
  hideSessionExpiredWarning: vi.fn(),
  getTokenTimeRemaining: vi.fn(),
  formatTokenExpiration: vi.fn(),
  isTokenExpiringSoon: vi.fn(),
});

describe('Settings Page Layout', () => {
  const mockUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    server.listen();
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('Page Structure', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));
    });

    it('should render page header with title and description', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('System Settings')).toBeInTheDocument();
      expect(
        screen.getByText(/Configure system-wide parameters/)
      ).toBeInTheDocument();
    });

    it('should render refresh button in header', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', {
        name: /refresh settings/i,
      });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should show development chip in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('DEV')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should render all five tabs', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Thresholds')).toBeInTheDocument();
      expect(screen.getByText('Audit Log')).toBeInTheDocument();
    });

    it('should show "Soon" chip for security tab', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Look for "Soon" chip (should be next to Security tab)
      const soonChips = screen.getAllByText('Soon');
      expect(soonChips.length).toBeGreaterThan(0);
    });

    it('should allow tab navigation', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Click on Feature Flags tab
      const featureFlagsTab = screen.getByText('Feature Flags');
      fireEvent.click(featureFlagsTab);

      // Should see Feature Flags content
      await waitFor(() => {
        expect(
          screen.getByText(/Toggle application features/)
        ).toBeInTheDocument();
      });
    });

    it('should have proper ARIA attributes for accessibility', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'settings tabs');

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);

      // Check first tab has proper attributes
      expect(tabs[0]).toHaveAttribute('id', 'settings-tab-0');
      expect(tabs[0]).toHaveAttribute('aria-controls', 'settings-tabpanel-0');
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));
    });

    it('should show skeleton loader while loading settings', async () => {
      // Delay the response to test loading state
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          return res(ctx.delay(100), ctx.json(mockSettings));
        })
      );

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Should show skeleton elements
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should hide skeleton and show content after loading', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByText('General Configuration')).toBeInTheDocument();
      });

      // Skeleton should be gone
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBe(0);
    });
  });

  describe('Error States', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));
    });

    it('should show error message when settings fail to load', async () => {
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        })
      );

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should show retry button in error state', async () => {
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        })
      );

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should allow retry on error', async () => {
      let callCount = 0;
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          callCount++;
          if (callCount === 1) {
            return res(ctx.status(500), ctx.json({ message: 'Server error' }));
          }
          return res(ctx.json(mockSettings));
        })
      );

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should load successfully on retry
      await waitFor(() => {
        expect(screen.getByText('General Configuration')).toBeInTheDocument();
      });
    });
  });

  describe('Access Control', () => {
    it('should show access denied for non-admin users', () => {
      mockUseAuth.mockReturnValue(createAuthMock(kamUser));

      render(
        <TestWrapper user={kamUser}>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText(/You must be an administrator/)
      ).toBeInTheDocument();
    });

    it('should show access denied for null user', () => {
      mockUseAuth.mockReturnValue(createAuthMock(null));

      render(
        <TestWrapper user={null}>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Content Information', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));
    });

    it('should show feature flags count when available', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Navigate to Feature Flags tab
      const featureFlagsTab = screen.getByText('Feature Flags');
      fireEvent.click(featureFlagsTab);

      await waitFor(() => {
        expect(screen.getByText(/4 feature flags/)).toBeInTheDocument();
        expect(screen.getByText(/2 enabled/)).toBeInTheDocument();
      });
    });

    it('should show thresholds count when available', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Navigate to Thresholds tab
      const thresholdsTab = screen.getByText('Thresholds');
      fireEvent.click(thresholdsTab);

      await waitFor(() => {
        expect(screen.getByText(/3 threshold values/)).toBeInTheDocument();
      });
    });

    it('should show last updated information in header', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });
  });

  describe('Development Debug Info', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));
    });

    it('should show debug info in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Development Info:')).toBeInTheDocument();
        expect(screen.getByText(/Settings loaded:/)).toBeInTheDocument();
        expect(screen.getByText(/Active tab:/)).toBeInTheDocument();
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show debug info in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText('Development Info:')).not.toBeInTheDocument();
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));
    });

    it('should have scrollable tabs', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist.closest('.MuiTabs-root')).toHaveClass(
        'MuiTabs-scrollable'
      );
    });

    it('should have proper tab spacing and styling', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('MuiTab-root');
      });
    });
  });
});
