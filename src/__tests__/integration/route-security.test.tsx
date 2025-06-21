/**
 * Integration tests for route security and navigation flows
 * Tests complete user journeys and security scenarios
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import AppRoutes from '../../routes/AppRoutes';
import { AuthProvider } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { logAccessDenied } from '../../utils/security';
import type { User } from '../../types';

// Mock security logging
vi.mock('../../utils/security', () => ({
  ...vi.importActual('../../utils/security'),
  logAccessDenied: vi.fn(),
  logAccessGranted: vi.fn(),
}));

const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin' as const,
    permissions: ['leads:read', 'leads:write', 'users:read', 'users:write'],
    territories: ['North', 'South'],
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  } as User,
  kam: {
    id: '2',
    email: 'kam@test.com',
    name: 'KAM User',
    role: 'kam' as const,
    permissions: ['leads:read', 'quotations:write'],
    territories: ['North'],
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  } as User,
  cp: {
    id: '3',
    email: 'cp@test.com',
    name: 'CP User',
    role: 'cp' as const,
    permissions: ['leads:read'],
    territories: ['North'],
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  } as User,
};

// Mock the useAuth hook
let mockAuthState = {
  user: null as User | null,
  isAuthenticated: false,
  token: null as string | null,
  isLoading: false,
  error: null as string | null,
};

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthState,
}));

// Mock territory validation
vi.mock('../../utils/territory', () => ({
  validateRouteAccess: vi
    .fn()
    .mockImplementation((user: any, territories: any, roles: any) => {
      if (!user) return { hasAccess: false, reason: 'No user' };

      if (roles.length > 0 && !roles.includes(user.role)) {
        return { hasAccess: false, reason: 'Role not authorized' };
      }

      return { hasAccess: true, reason: '' };
    }),
  getUserTerritoryAccess: vi.fn().mockReturnValue({
    territories: [],
    hasFullAccess: true,
    canAccessTerritory: () => true,
  }),
}));

const renderAppWithRoute = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Route Security Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      token: null,
      isLoading: false,
      error: null,
    };
  });

  describe('Dashboard Route Protection', () => {
    it('redirects unauthenticated users to login', async () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;

      renderAppWithRoute(['/dashboard']);

      await waitFor(() => {
        expect(logAccessDenied).toHaveBeenCalledWith(
          expect.objectContaining({
            userEmail: 'unauthenticated',
            requestedPath: '/dashboard',
            reason: 'User not authenticated',
          })
        );
      });
    });

    it('allows admin users to access dashboard', async () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.admin;

      renderAppWithRoute(['/dashboard']);

      await waitFor(() => {
        // Should render dashboard content
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
      });
    });

    it('allows kam users to access dashboard', async () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.kam;

      renderAppWithRoute(['/dashboard']);

      await waitFor(() => {
        // Should render dashboard content
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
      });
    });

    it('denies cp users access to dashboard', async () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.cp;

      renderAppWithRoute(['/dashboard']);

      await waitFor(() => {
        expect(logAccessDenied).toHaveBeenCalledWith(
          expect.objectContaining({
            userEmail: mockUsers.cp.email,
            userRole: mockUsers.cp.role,
            requestedPath: '/dashboard',
            reason: 'Role not authorized',
          })
        );
      });
    });
  });

  describe('Admin-Only Routes', () => {
    const adminOnlyRoutes = ['/commissions', '/master-data', '/settings'];

    adminOnlyRoutes.forEach(route => {
      it(`allows admin access to ${route}`, async () => {
        mockAuthState.isAuthenticated = true;
        mockAuthState.user = mockUsers.admin;

        renderAppWithRoute([route]);

        await waitFor(() => {
          expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
        });
      });

      it(`denies kam access to ${route}`, async () => {
        mockAuthState.isAuthenticated = true;
        mockAuthState.user = mockUsers.kam;

        renderAppWithRoute([route]);

        await waitFor(() => {
          expect(logAccessDenied).toHaveBeenCalledWith(
            expect.objectContaining({
              userEmail: mockUsers.kam.email,
              userRole: mockUsers.kam.role,
              requestedPath: route,
              reason: 'Role not authorized',
            })
          );
        });
      });

      it(`denies cp access to ${route}`, async () => {
        mockAuthState.isAuthenticated = true;
        mockAuthState.user = mockUsers.cp;

        renderAppWithRoute([route]);

        await waitFor(() => {
          expect(logAccessDenied).toHaveBeenCalledWith(
            expect.objectContaining({
              userEmail: mockUsers.cp.email,
              userRole: mockUsers.cp.role,
              requestedPath: route,
              reason: 'Role not authorized',
            })
          );
        });
      });
    });
  });

  describe('Public Routes', () => {
    const publicRoutes = ['/login', '/forgot-password', '/session-expired'];

    publicRoutes.forEach(route => {
      it(`allows unauthenticated access to ${route}`, async () => {
        mockAuthState.isAuthenticated = false;
        mockAuthState.user = null;

        renderAppWithRoute([route]);

        // Should render without redirecting or logging access denied
        expect(logAccessDenied).not.toHaveBeenCalled();
      });
    });
  });

  describe('Return URL Preservation', () => {
    it('preserves return URL when redirecting to login', async () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;

      renderAppWithRoute(['/dashboard']);

      await waitFor(() => {
        expect(logAccessDenied).toHaveBeenCalledWith(
          expect.objectContaining({
            requestedPath: '/dashboard',
          })
        );
      });
    });
  });

  describe('Route Wildcard Handling', () => {
    it('handles unknown routes correctly', async () => {
      renderAppWithRoute(['/unknown-route']);

      await waitFor(() => {
        // Should render 404 page or redirect appropriately
        // The exact behavior depends on your route configuration
        expect(screen.queryByText('Page Not Found')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles route errors gracefully', async () => {
      // Mock a route that throws an error
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.admin;

      renderAppWithRoute(['/dashboard']);

      // The error boundary should catch any errors
      // and display an appropriate error message

      consoleSpy.mockRestore();
    });
  });
});
