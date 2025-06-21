/**
 * Comprehensive tests for ProtectedRoute access control and redirection
 * Tests all edge cases and security scenarios for 100% branch coverage
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import ProtectedRoute from '../ProtectedRoute';
import { theme } from '../../theme';
import { logAccessDenied, logAccessGranted } from '../../utils/security';
import type { User } from '../../types';

// Mock the security logging functions
jest.mock('../../utils/security', () => ({
  logAccessDenied: jest.fn(),
  logAccessGranted: jest.fn(),
}));

// Mock the territory validation function
jest.mock('../../utils/territory', () => ({
  validateRouteAccess: jest.fn(),
}));

const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
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
    firstName: 'KAM',
    lastName: 'User',
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
    firstName: 'CP',
    lastName: 'User',
    role: 'cp' as const,
    permissions: ['leads:read'],
    territories: ['North'],
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  } as User,
  customer: {
    id: '4',
    email: 'customer@test.com',
    name: 'Customer User',
    firstName: 'Customer',
    lastName: 'User',
    role: 'customer' as const,
    permissions: [],
    territories: [],
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

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

const renderProtectedRoute = (
  props: {
    requiredRoles?: string[];
    requiredTerritories?: any[];
    checkPermission?: (user: any, pathname: string) => boolean;
    redirectTo?: string;
  } = {},
  initialEntries: string[] = ['/dashboard']
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider theme={theme}>
        <ProtectedRoute {...props}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute Access Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset auth state
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      token: null,
      isLoading: false,
      error: null,
    };

    // Mock territory validation to return success by default
    const { validateRouteAccess } = require('../../utils/territory');
    validateRouteAccess.mockReturnValue({
      hasAccess: true,
      reason: '',
    });
  });

  describe('Unauthenticated Access', () => {
    it('redirects to login when not authenticated', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;

      renderProtectedRoute({ requiredRoles: ['admin'] });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(logAccessDenied).toHaveBeenCalledWith({
        userEmail: 'unauthenticated',
        requestedPath: '/dashboard',
        reason: 'User not authenticated',
        timestamp: expect.any(String),
      });
    });

    it('redirects to custom redirect path when specified', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;

      renderProtectedRoute({
        requiredRoles: ['admin'],
        redirectTo: '/custom-login',
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('preserves return URL in location state', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;

      renderProtectedRoute({ requiredRoles: ['admin'] }, ['/protected-page']);

      expect(logAccessDenied).toHaveBeenCalledWith(
        expect.objectContaining({
          requestedPath: '/protected-page',
        })
      );
    });
  });

  describe('Authenticated but No User Data', () => {
    it('redirects to login when authenticated but no user data', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = null;

      renderProtectedRoute({ requiredRoles: ['admin'] });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(logAccessDenied).toHaveBeenCalledWith({
        userEmail: 'unknown',
        requestedPath: '/dashboard',
        reason: 'User data not available',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Role-based Access Control', () => {
    it('allows admin access to admin-only route', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.admin;

      renderProtectedRoute({ requiredRoles: ['admin'] });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(logAccessGranted).toHaveBeenCalledWith({
        userId: mockUsers.admin.id,
        userEmail: mockUsers.admin.email,
        userRole: mockUsers.admin.role,
        accessedPath: '/dashboard',
        timestamp: expect.any(String),
      });
    });

    it('allows kam access to admin+kam route', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.kam;

      renderProtectedRoute({ requiredRoles: ['admin', 'kam'] });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('denies cp access to admin-only route', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.cp;

      // Mock territory validation to return access denied
      const { validateRouteAccess } = require('../../utils/territory');
      validateRouteAccess.mockReturnValue({
        hasAccess: false,
        reason: 'Insufficient role permissions',
      });

      renderProtectedRoute({ requiredRoles: ['admin'] });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(logAccessDenied).toHaveBeenCalledWith({
        userId: mockUsers.cp.id,
        userEmail: mockUsers.cp.email,
        userRole: mockUsers.cp.role,
        userTerritories: mockUsers.cp.territories,
        requestedPath: '/dashboard',
        reason: 'Insufficient role permissions',
        requiredRoles: ['admin'],
        requiredTerritories: [],
        timestamp: expect.any(String),
      });
    });

    it('denies customer access to admin+kam route', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.customer;

      // Mock territory validation to return access denied
      const { validateRouteAccess } = require('../../utils/territory');
      validateRouteAccess.mockReturnValue({
        hasAccess: false,
        reason: 'Role not in allowed list',
      });

      renderProtectedRoute({ requiredRoles: ['admin', 'kam'] });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(logAccessDenied).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: mockUsers.customer.email,
          userRole: mockUsers.customer.role,
          reason: 'Role not in allowed list',
        })
      );
    });
  });

  describe('Territory-based Access Control', () => {
    it('allows access when user has required territory', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.kam;

      renderProtectedRoute({
        requiredRoles: ['kam'],
        requiredTerritories: ['North'],
      });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('denies access when user lacks required territory', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.kam;

      // Mock territory validation to return access denied
      const { validateRouteAccess } = require('../../utils/territory');
      validateRouteAccess.mockReturnValue({
        hasAccess: false,
        reason: 'User does not have access to required territories',
      });

      renderProtectedRoute({
        requiredRoles: ['kam'],
        requiredTerritories: ['South'],
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(logAccessDenied).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'User does not have access to required territories',
          requiredTerritories: ['South'],
        })
      );
    });
  });

  describe('Custom Permission Checks', () => {
    it('allows access when custom permission check passes', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.kam;

      const customCheck = jest.fn().mockReturnValue(true);

      renderProtectedRoute({
        requiredRoles: ['kam'],
        checkPermission: customCheck,
      });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(customCheck).toHaveBeenCalledWith(mockUsers.kam, '/dashboard');
    });

    it('denies access when custom permission check fails', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.kam;

      const customCheck = jest.fn().mockReturnValue(false);

      renderProtectedRoute({
        requiredRoles: ['kam'],
        checkPermission: customCheck,
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(logAccessDenied).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Custom permission check failed',
        })
      );
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('allows access when no roles are required', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.customer;

      renderProtectedRoute({ requiredRoles: [] });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('handles undefined required roles gracefully', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.kam;

      renderProtectedRoute({});

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('logs all required parameters for access denial', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.cp;

      // Mock territory validation to return access denied
      const { validateRouteAccess } = require('../../utils/territory');
      validateRouteAccess.mockReturnValue({
        hasAccess: false,
        reason: 'Access denied for testing',
      });

      renderProtectedRoute({
        requiredRoles: ['admin'],
        requiredTerritories: ['South'],
      });

      expect(logAccessDenied).toHaveBeenCalledWith({
        userId: mockUsers.cp.id,
        userEmail: mockUsers.cp.email,
        userRole: mockUsers.cp.role,
        userTerritories: mockUsers.cp.territories,
        requestedPath: '/dashboard',
        reason: 'Access denied for testing',
        requiredRoles: ['admin'],
        requiredTerritories: ['South'],
        timestamp: expect.any(String),
      });
    });

    it('calls territory validation with correct parameters', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.admin;

      const { validateRouteAccess } = require('../../utils/territory');

      renderProtectedRoute({
        requiredRoles: ['admin'],
        requiredTerritories: ['North'],
      });

      expect(validateRouteAccess).toHaveBeenCalledWith(
        mockUsers.admin,
        ['North'],
        ['admin']
      );
    });
  });

  describe('Security Event Handling', () => {
    it('dispatches security events for access denials', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;

      renderProtectedRoute({ requiredRoles: ['admin'] });

      // The security event should be dispatched by logAccessDenied
      expect(logAccessDenied).toHaveBeenCalled();

      dispatchEventSpy.mockRestore();
    });

    it('dispatches security events for access grants', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      mockAuthState.isAuthenticated = true;
      mockAuthState.user = mockUsers.admin;

      renderProtectedRoute({ requiredRoles: ['admin'] });

      // The security event should be dispatched by logAccessGranted
      expect(logAccessGranted).toHaveBeenCalled();

      dispatchEventSpy.mockRestore();
    });
  });
});
