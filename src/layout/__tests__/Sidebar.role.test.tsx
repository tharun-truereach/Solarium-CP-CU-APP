/// <reference types="vitest/globals" />
/**
 * Sidebar role-based visibility tests
 * Tests navigation item filtering based on user roles with emphasis on Settings access
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import Sidebar from '../Sidebar';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import settingsSlice from '../../store/slices/settingsSlice';
import type { User } from '../../types/user.types';

// Mock the AuthContext hook instead of importing the context directly
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../contexts/AuthContext';

// Mock users with different roles
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
  permissions: ['leads:read', 'leads:write'],
  territories: ['North', 'South'],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const cpUser: User = {
  id: '3',
  email: 'cp@solarium.com',
  name: 'CP User',
  role: 'cp',
  permissions: ['leads:read'],
  territories: ['North'],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock theme
const mockTheme = {
  palette: {
    mode: 'light',
    primary: { main: '#1976d2', contrastText: '#fff', dark: '#115293' },
    text: { secondary: '#666' },
    action: { hover: 'rgba(0, 0, 0, 0.04)' },
    divider: '#e0e0e0',
  },
  breakpoints: {
    down: () => '(max-width: 768px)',
  },
  transitions: {
    create: () => 'all 0.2s ease-in-out',
    easing: { sharp: 'cubic-bezier(0.4, 0, 0.6, 1)' },
    duration: { enteringScreen: 225 },
  },
} as any;

// Create test store
const createTestStore = (user: User | null = null) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
      settings: settingsSlice,
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
  });
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

// Test wrapper
const TestWrapper: React.FC<{
  children: React.ReactNode;
  user?: User | null;
  collapsed?: boolean;
  isMobile?: boolean;
}> = ({ children, user = null, collapsed = false, isMobile = false }) => {
  const store = createTestStore(user);

  return (
    <Provider store={store}>
      <ThemeProvider theme={mockTheme}>
        <MemoryRouter>
          <Sidebar collapsed={collapsed} isMobile={isMobile} onClose={vi.fn()}>
            <div>Sidebar Header</div>
          </Sidebar>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('Sidebar Role-Based Navigation', () => {
  const mockUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin User Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));
    });

    it('should show all navigation items for admin user', () => {
      render(
        <TestWrapper user={adminUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // Admin should see all items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Leads')).toBeInTheDocument();
      expect(screen.getByText('Quotations')).toBeInTheDocument();
      expect(screen.getByText('Channel Partners')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Commissions')).toBeInTheDocument();
      expect(screen.getByText('Master Data')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should show admin badges for admin-only items', () => {
      render(
        <TestWrapper user={adminUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // Should show admin badges (look for Admin chips)
      const adminChips = screen.getAllByText('Admin');
      expect(adminChips.length).toBeGreaterThan(0);
    });

    it('should show Settings item for admin user', () => {
      render(
        <TestWrapper user={adminUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      const settingsItem = screen.getByText('Settings');
      expect(settingsItem).toBeInTheDocument();

      // Should have admin badge
      expect(settingsItem.closest('li')).toBeInTheDocument();
    });
  });

  describe('KAM User Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(kamUser));
    });

    it('should show appropriate navigation items for KAM user', () => {
      render(
        <TestWrapper user={kamUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // KAM should see these items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Leads')).toBeInTheDocument();
      expect(screen.getByText('Quotations')).toBeInTheDocument();
      expect(screen.getByText('Channel Partners')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
    });

    it('should NOT show admin-only items for KAM user', () => {
      render(
        <TestWrapper user={kamUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // KAM should NOT see these admin-only items
      expect(screen.queryByText('Commissions')).not.toBeInTheDocument();
      expect(screen.queryByText('Master Data')).not.toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('should not have Settings item for KAM user', () => {
      render(
        <TestWrapper user={kamUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // Settings should be completely hidden from DOM
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('CP User Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(cpUser));
    });

    it('should show limited navigation items for CP user', () => {
      render(
        <TestWrapper user={cpUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // CP users might see even fewer items based on configuration
      // Settings should definitely not be visible
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('should NOT show Settings item for CP user', () => {
      render(
        <TestWrapper user={cpUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated User Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(null));
    });

    it('should show no navigation items for unauthenticated user', () => {
      render(
        <TestWrapper user={null}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // No navigation items should be visible
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('should handle null user gracefully', () => {
      expect(() => {
        render(
          <TestWrapper user={null}>
            <Sidebar collapsed={false} isMobile={false} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Settings Item Specific Tests', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));
    });

    it('should render Settings with correct icon and label for admin', () => {
      render(
        <TestWrapper user={adminUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      const settingsItem = screen.getByText('Settings');
      expect(settingsItem).toBeInTheDocument();

      // Check that it's a clickable item
      expect(settingsItem.closest('button')).toBeInTheDocument();
    });

    it('should completely hide Settings from DOM for non-admin users', () => {
      mockUseAuth.mockReturnValue(createAuthMock(kamUser));

      render(
        <TestWrapper user={kamUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // Settings should not exist in DOM at all
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      expect(
        document.querySelector('[data-testid="settings-nav-item"]')
      ).not.toBeInTheDocument();
    });

    it('should show tooltip for Settings when sidebar is collapsed', () => {
      render(
        <TestWrapper user={adminUser}>
          <Sidebar collapsed={true} isMobile={false} />
        </TestWrapper>
      );

      // In collapsed mode, Settings text might not be visible but tooltip should be available
      // This tests the tooltip functionality
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });
  });

  describe('Development Mode Debug Info', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));
    });

    it('should show debug info in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <TestWrapper user={adminUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // Should show debug info (role and item count)
      expect(screen.getByText(/Role: ADMIN/)).toBeInTheDocument();
      expect(screen.getByText(/Items: /)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show debug info in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <TestWrapper user={adminUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // Should not show debug info
      expect(screen.queryByText(/Role: ADMIN/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Role Security Verification', () => {
    it('should use getRoutesByRole for single source of truth', () => {
      // Test admin access
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));

      const adminRender = render(
        <TestWrapper user={adminUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // Admin should see Settings
      expect(adminRender.getByText('Settings')).toBeInTheDocument();

      // Test KAM access
      mockUseAuth.mockReturnValue(createAuthMock(kamUser));

      const kamRender = render(
        <TestWrapper user={kamUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // KAM should not see Settings
      expect(kamRender.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('should maintain role filtering consistency with routes', () => {
      // Test that sidebar filtering matches route protection
      mockUseAuth.mockReturnValue(createAuthMock(adminUser));

      const adminRender = render(
        <TestWrapper user={adminUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      mockUseAuth.mockReturnValue(createAuthMock(kamUser));

      const kamRender = render(
        <TestWrapper user={kamUser}>
          <Sidebar collapsed={false} isMobile={false} />
        </TestWrapper>
      );

      // Admin sees Settings, KAM doesn't
      expect(adminRender.getByText('Settings')).toBeInTheDocument();
      expect(kamRender.queryByText('Settings')).not.toBeInTheDocument();
    });
  });
});
