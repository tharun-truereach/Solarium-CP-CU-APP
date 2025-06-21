/**
 * Test suite for ProtectedRoute territory-based access control
 * Tests role and territory validation for route protection
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import { apiSlice } from '../../api/apiSlice';
import type { User, Territory } from '../../types/user.types';

// Mock console.warn to avoid test noise
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Test users
const adminUser: User = {
  id: '1',
  email: 'admin@solarium.com',
  name: 'Admin User',
  role: 'admin',
  permissions: ['leads:read', 'leads:write', 'users:read', 'settings:write'],
  territories: [], // Admin has access to all territories
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const kamUserNorth: User = {
  id: '2',
  email: 'kam.north@solarium.com',
  name: 'KAM North',
  role: 'kam',
  permissions: ['leads:read', 'leads:write'],
  territories: ['North', 'Northeast'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const kamUserSouth: User = {
  id: '3',
  email: 'kam.south@solarium.com',
  name: 'KAM South',
  role: 'kam',
  permissions: ['leads:read', 'leads:write'],
  territories: ['South', 'Southeast'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const unauthorizedUser: User = {
  id: '4',
  email: 'user@solarium.com',
  name: 'Regular User',
  role: 'customer',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

// Test component
const TestComponent: React.FC = () => <div>Protected Content</div>;

// Helper function to create store with user
const createStoreWithUser = (user: User | null) => {
  const store = configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActions: ['persist/PERSIST'] },
      }).concat(apiSlice.middleware),
  });

  if (user) {
    store.dispatch({
      type: 'auth/login',
      payload: {
        user,
        token: 'mock-token',
        expiresAt: '2024-12-31T23:59:59Z',
      },
    });
  }

  return store;
};

// Render component with providers
const renderWithProviders = (
  component: React.ReactElement,
  user: User | null = null,
  initialRoute = '/'
) => {
  const store = createStoreWithUser(user);

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>{component}</AuthProvider>
      </MemoryRouter>
    </Provider>
  );
};

describe('ProtectedRoute Territory Access Control', () => {
  beforeEach(() => {
    mockConsoleWarn.mockClear();
  });

  describe('Authentication Requirements', () => {
    it('should redirect unauthenticated users to login', () => {
      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        null // No user
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render content for authenticated users with no restrictions', () => {
      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        adminUser
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin users to access admin-only routes', () => {
      renderWithProviders(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestComponent />
        </ProtectedRoute>,
        adminUser
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow KAM users to access KAM-allowed routes', () => {
      renderWithProviders(
        <ProtectedRoute requiredRoles={['admin', 'kam']}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny access to users with insufficient roles', () => {
      renderWithProviders(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Access denied'),
        expect.objectContaining({
          reason: 'INVALID_ROLE',
          userRole: 'kam',
        })
      );
    });

    it('should deny access to unauthorized user roles', () => {
      renderWithProviders(
        <ProtectedRoute requiredRoles={['admin', 'kam']}>
          <TestComponent />
        </ProtectedRoute>,
        unauthorizedUser
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Access denied'),
        expect.objectContaining({
          reason: 'INVALID_ROLE',
          userRole: 'customer',
        })
      );
    });
  });

  describe('Territory-Based Access Control', () => {
    it('should allow admin users to access any territory', () => {
      const territories: Territory[] = ['North', 'South', 'East'];

      renderWithProviders(
        <ProtectedRoute requiredTerritories={territories}>
          <TestComponent />
        </ProtectedRoute>,
        adminUser
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow KAM users to access their assigned territories', () => {
      renderWithProviders(
        <ProtectedRoute requiredTerritories={['North']}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow KAM users to access routes requiring any of their territories', () => {
      renderWithProviders(
        <ProtectedRoute requiredTerritories={['North', 'West']}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth // Has North and Northeast
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny KAM users access to territories they are not assigned to', () => {
      renderWithProviders(
        <ProtectedRoute requiredTerritories={['South']}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth // Has North and Northeast, not South
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Access denied'),
        expect.objectContaining({
          reason: 'INVALID_TERRITORY',
          userTerritories: ['North', 'Northeast'],
          requiredTerritories: ['South'],
        })
      );
    });

    it('should deny access when KAM user has no matching territories', () => {
      renderWithProviders(
        <ProtectedRoute requiredTerritories={['West', 'Central']}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserSouth // Has South and Southeast
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Access denied'),
        expect.objectContaining({
          reason: 'INVALID_TERRITORY',
          userTerritories: ['South', 'Southeast'],
          requiredTerritories: ['West', 'Central'],
        })
      );
    });
  });

  describe('Combined Role and Territory Access Control', () => {
    it('should allow access when both role and territory requirements are met', () => {
      renderWithProviders(
        <ProtectedRoute
          requiredRoles={['kam']}
          requiredTerritories={['Northeast']}
        >
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth // Role: kam, Territories: North, Northeast
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny access when role requirement is met but territory is not', () => {
      renderWithProviders(
        <ProtectedRoute requiredRoles={['kam']} requiredTerritories={['West']}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth // Role: kam, but no West territory
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Access denied'),
        expect.objectContaining({
          reason: 'INVALID_TERRITORY',
        })
      );
    });

    it('should deny access when territory requirement is met but role is not', () => {
      renderWithProviders(
        <ProtectedRoute
          requiredRoles={['admin']}
          requiredTerritories={['North']}
        >
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth // Has North territory but not admin role
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Access denied'),
        expect.objectContaining({
          reason: 'INVALID_ROLE',
        })
      );
    });
  });

  describe('Custom Permission Checks', () => {
    it('should allow access when custom permission check passes', () => {
      const checkPermission = vi.fn(() => true);

      renderWithProviders(
        <ProtectedRoute checkPermission={checkPermission}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(checkPermission).toHaveBeenCalledWith(kamUserNorth, '/');
    });

    it('should deny access when custom permission check fails', () => {
      const checkPermission = vi.fn(() => false);

      renderWithProviders(
        <ProtectedRoute checkPermission={checkPermission}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(checkPermission).toHaveBeenCalledWith(kamUserNorth, '/');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Custom permission check failed'),
        expect.objectContaining({
          userRole: 'kam',
          userTerritories: ['North', 'Northeast'],
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty required arrays gracefully', () => {
      renderWithProviders(
        <ProtectedRoute requiredRoles={[]} requiredTerritories={[]}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should handle undefined territory arrays', () => {
      const userWithoutTerritories: User = {
        ...kamUserNorth,
        territories: undefined as any,
      };

      renderWithProviders(
        <ProtectedRoute requiredTerritories={['North']}>
          <TestComponent />
        </ProtectedRoute>,
        userWithoutTerritories
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should log security events for access attempts', () => {
      renderWithProviders(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestComponent />
        </ProtectedRoute>,
        kamUserNorth,
        '/admin-panel'
      );

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Access denied for user kam.north@solarium.com to /admin-panel'
        ),
        expect.objectContaining({
          reason: 'INVALID_ROLE',
          userRole: 'kam',
          userTerritories: ['North', 'Northeast'],
          requiredRoles: ['admin'],
          timestamp: expect.any(String),
        })
      );
    });
  });
});
