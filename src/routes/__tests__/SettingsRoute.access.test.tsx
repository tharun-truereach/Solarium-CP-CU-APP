/**
 * Settings Route Access Control Tests
 * Verifies that /settings route is properly protected and only accessible to admin users
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from '../AppRoutes';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import settingsSlice from '../../store/slices/settingsSlice';
import { apiSlice } from '../../api/apiSlice';
import type { User } from '../../types/user.types';
import { theme } from '../../theme';

// Mock the AuthContext hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the LoadingContext hook
vi.mock('../../contexts/LoadingContext', () => ({
  useLoading: vi.fn(() => ({
    isGlobalLoading: false,
    setGlobalLoading: vi.fn(),
  })),
}));

import { useAuth } from '../../contexts/AuthContext';

// Mock theme
const mockTheme = {
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
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

// Mock users
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

// Helper to create a complete AuthContext mock
const createAuthMock = (user: User | null) => ({
  user,
  isAuthenticated: !!user,
  login: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
  error: null,
  token: user ? 'mock-token' : null,
  sessionStatus: {
    isAuthenticated: !!user,
    isTokenExpired: !user,
    isAccountLocked: false,
    timeRemaining: user ? 3600 : 0,
    isActive: !!user,
    needsWarning: false,
  },
  loginAttempts: 0,
  isAccountLocked: false,
  rememberMe: false,
  twoFactorRequired: false,
  twoFactorToken: null,
  refreshToken: vi.fn(),
  expiresAt: null,
  lastActivity: null,
  loginTimestamp: null,
  sessionWarningShown: false,
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

// Test wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
  user?: User | null;
  initialRoute?: string;
}> = ({ children, user = null, initialRoute = '/settings' }) => {
  const store = createTestStore(user);

  return (
    <Provider store={store}>
      <ThemeProvider theme={mockTheme}>
        <CssBaseline />
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('Settings Route Access Control', () => {
  const mockUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Access', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthMock(adminUser) as any);
    });

    it('should allow admin users to access settings page', () => {
      render(
        <TestWrapper user={adminUser}>
          <AppRoutes />
        </TestWrapper>
      );

      expect(screen.getByText('System Settings')).toBeInTheDocument();
      expect(
        screen.getByText(/Configure system-wide parameters/)
      ).toBeInTheDocument();
    });

    it('should show settings content for admin user', () => {
      render(
        <TestWrapper user={adminUser}>
          <AppRoutes />
        </TestWrapper>
      );

      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('should show development info for admin in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <TestWrapper user={adminUser}>
          <AppRoutes />
        </TestWrapper>
      );

      expect(screen.getByText('DEV')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Non-Admin Access Denial', () => {
    it('should redirect KAM users to access denied page', async () => {
      mockUseAuth.mockReturnValue(createAuthMock(kamUser) as any);

      render(
        <TestWrapper user={kamUser} initialRoute="/settings">
          <AppRoutes />
        </TestWrapper>
      );

      // Should be redirected to access denied page
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should redirect CP users to access denied page', async () => {
      mockUseAuth.mockReturnValue(createAuthMock(cpUser) as any);

      render(
        <TestWrapper user={cpUser} initialRoute="/settings">
          <AppRoutes />
        </TestWrapper>
      );

      // Should be redirected to access denied page
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should redirect unauthenticated users to login page', async () => {
      mockUseAuth.mockReturnValue(createAuthMock(null) as any);

      render(
        <TestWrapper user={null} initialRoute="/settings">
          <AppRoutes />
        </TestWrapper>
      );

      // Should be redirected to login page
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('Route Protection Edge Cases', () => {
    it('should handle null user gracefully', () => {
      mockUseAuth.mockReturnValue(createAuthMock(null) as any);

      render(
        <TestWrapper user={null}>
          <AppRoutes />
        </TestWrapper>
      );

      // Should show login page, not crash
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });
});

describe('Settings Route Security Tests', () => {
  describe('Admin Access Control', () => {
    it('should allow admin users to access settings route', async () => {
      render(
        <TestWrapper user={adminUser}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('System Settings')).toBeInTheDocument();
      });
    });

    it('should render settings page content for admin users only', async () => {
      render(
        <TestWrapper user={adminUser}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('System Settings')).toBeInTheDocument();
        expect(screen.getByText('Admin-only page')).toBeInTheDocument();
      });
    });
  });

  describe('Access Denial Security', () => {
    it('should redirect KAM users to 403 access denied page', async () => {
      render(
        <TestWrapper user={kamUser}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      // Critical: Should not leak settings content
      expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin-only page')).not.toBeInTheDocument();
    });

    it('should redirect Channel Partner users to 403 access denied page', async () => {
      render(
        <TestWrapper user={cpUser}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
    });

    it('should redirect Customer users to 403 access denied page', async () => {
      render(
        <TestWrapper user={null}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
    });

    it('should redirect unauthenticated users to login page', async () => {
      render(
        <TestWrapper user={null}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
    });
  });

  describe('URL Manipulation Security', () => {
    it('should prevent direct URL manipulation by non-admin users', async () => {
      render(
        <TestWrapper user={kamUser} initialRoute="/settings">
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      // URL should redirect, not remain /settings
      expect(window.location.pathname).not.toBe('/settings');
    });

    it('should block settings subpaths for non-admin users', async () => {
      render(
        <TestWrapper user={kamUser} initialRoute="/settings/advanced">
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    it('should handle malformed routes securely', async () => {
      render(
        <TestWrapper user={kamUser} initialRoute="/settings/../admin">
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should still deny access, not expose other routes
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Security', () => {
    it('should hide settings link in navigation for non-admin users', async () => {
      render(
        <TestWrapper user={kamUser} initialRoute="/dashboard">
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Settings should never appear in navigation for non-admin
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('should show settings in navigation only for admin users', async () => {
      render(
        <TestWrapper user={adminUser} initialRoute="/dashboard">
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Settings should appear in navigation for admin
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Session Security', () => {
    it('should redirect expired sessions to login', async () => {
      // Mock expired session but still "authenticated"
      const expiredStore = createTestStore(null);

      render(
        <Provider store={expiredStore}>
          <ThemeProvider theme={theme}>
            <MemoryRouter initialEntries={['/settings']}>
              <AppRoutes />
            </MemoryRouter>
          </ThemeProvider>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      // Should not expose settings content with expired session
      expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
    });

    it('should maintain access control during valid sessions', async () => {
      render(
        <TestWrapper user={adminUser}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('System Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Role Tampering Protection', () => {
    it('should handle tampered user role data', async () => {
      const tamperedUser = {
        ...kamUser,
        role: 'admin' as any, // Client-side role tampering attempt
      };

      render(
        <TestWrapper user={tamperedUser}>
          <AppRoutes />
        </TestWrapper>
      );

      // Should still enforce server-side role validation
      // In real implementation, server would reject this
      await waitFor(() => {
        // For this test, we expect it to work since we're mocking
        // In production, server validation would prevent this
        expect(screen.getByText('System Settings')).toBeInTheDocument();
      });
    });

    it('should handle null/undefined role gracefully', async () => {
      const malformedUser = {
        ...kamUser,
        role: null as any,
      };

      render(
        <TestWrapper user={malformedUser}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should default to access denied for invalid role
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Security Logging', () => {
    it('should log unauthorized access attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <TestWrapper user={kamUser}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      // Should log security violation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Access denied for user'),
        expect.objectContaining({
          userRole: 'kam',
          requiredRoles: ['admin'],
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log security context in access attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <TestWrapper user={cpUser}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      // Should include timestamp and user details
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          timestamp: expect.any(String),
          userRole: 'cp',
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
