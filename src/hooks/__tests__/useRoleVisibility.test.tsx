/**
 * Test suite for useRoleVisibility hook
 * Tests role-based UI visibility logic
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import {
  useRoleVisibility,
  useAdminFeatures,
  useTerritoryDisplay,
  useConditionalRender,
} from '../useRoleVisibility';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import { apiSlice } from '../../api/apiSlice';
import type { User } from '../../types/user.types';
import type { RouteInfo } from '../../routes/routes';

// Test users
const adminUser: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin',
  permissions: ['users:read', 'settings:write'],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

const kamUser: User = {
  id: '2',
  email: 'kam@test.com',
  name: 'KAM User',
  role: 'kam',
  permissions: ['leads:read'],
  territories: ['North', 'Northeast'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

// Test routes
const publicRoute: RouteInfo = {
  path: '/',
  title: 'Home',
  requiresAuth: false,
  showInNavigation: true,
};

const adminRoute: RouteInfo = {
  path: '/admin',
  title: 'Admin Panel',
  requiresAuth: true,
  allowedRoles: ['admin'],
  showInNavigation: true,
};

const kamRoute: RouteInfo = {
  path: '/leads',
  title: 'Leads',
  requiresAuth: true,
  allowedRoles: ['admin', 'kam'],
  showInNavigation: true,
};

const territoryRoute: RouteInfo = {
  path: '/north-leads',
  title: 'North Leads',
  requiresAuth: true,
  allowedRoles: ['kam'],
  requiredTerritories: ['North'],
  showInNavigation: true,
};

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
      }),
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

// Wrapper component for hooks
const createWrapper = (user: User | null) => {
  const store = createStoreWithUser(user);

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useRoleVisibility Hook', () => {
  describe('Public Routes', () => {
    it('should show public routes for unauthenticated users', () => {
      const wrapper = createWrapper(null);
      const { result } = renderHook(() => useRoleVisibility(publicRoute), {
        wrapper,
      });

      expect(result.current).toBe(true);
    });

    it('should show public routes for authenticated users', () => {
      const wrapper = createWrapper(adminUser);
      const { result } = renderHook(() => useRoleVisibility(publicRoute), {
        wrapper,
      });

      expect(result.current).toBe(true);
    });
  });

  describe('Protected Routes - Role-Based', () => {
    it('should hide protected routes from unauthenticated users', () => {
      const wrapper = createWrapper(null);
      const { result } = renderHook(() => useRoleVisibility(adminRoute), {
        wrapper,
      });

      expect(result.current).toBe(false);
    });

    it('should show admin routes to admin users', () => {
      const wrapper = createWrapper(adminUser);
      const { result } = renderHook(() => useRoleVisibility(adminRoute), {
        wrapper,
      });

      expect(result.current).toBe(true);
    });

    it('should hide admin routes from KAM users', () => {
      const wrapper = createWrapper(kamUser);
      const { result } = renderHook(() => useRoleVisibility(adminRoute), {
        wrapper,
      });

      expect(result.current).toBe(false);
    });

    it('should show shared routes to both admin and KAM users', () => {
      const adminWrapper = createWrapper(adminUser);
      const kamWrapper = createWrapper(kamUser);

      const { result: adminResult } = renderHook(
        () => useRoleVisibility(kamRoute),
        { wrapper: adminWrapper }
      );
      const { result: kamResult } = renderHook(
        () => useRoleVisibility(kamRoute),
        { wrapper: kamWrapper }
      );

      expect(adminResult.current).toBe(true);
      expect(kamResult.current).toBe(true);
    });
  });

  describe('Territory-Based Routes', () => {
    it('should show territory routes to users with matching territories', () => {
      const wrapper = createWrapper(kamUser); // Has North territory
      const { result } = renderHook(() => useRoleVisibility(territoryRoute), {
        wrapper,
      });

      expect(result.current).toBe(true);
    });

    it('should hide territory routes from users without matching territories', () => {
      const kamUserSouth = { ...kamUser, territories: ['South' as const] };
      const wrapper = createWrapper(kamUserSouth);
      const { result } = renderHook(() => useRoleVisibility(territoryRoute), {
        wrapper,
      });

      expect(result.current).toBe(false);
    });

    it('should show territory routes to admin users regardless of territories', () => {
      const wrapper = createWrapper(adminUser);
      const { result } = renderHook(() => useRoleVisibility(territoryRoute), {
        wrapper,
      });

      expect(result.current).toBe(true);
    });
  });
});

describe('useAdminFeatures Hook', () => {
  it('should return all admin features enabled for admin users', () => {
    const wrapper = createWrapper(adminUser);
    const { result } = renderHook(() => useAdminFeatures(), { wrapper });

    expect(result.current.canManageUsers).toBe(true);
    expect(result.current.canManageSettings).toBe(true);
    expect(result.current.canViewCommissions).toBe(true);
    expect(result.current.canManageMasterData).toBe(true);
    expect(result.current.showAdminBadge).toBe(true);
    expect(result.current.showAdvancedReports).toBe(true);
  });

  it('should return limited features for KAM users', () => {
    const wrapper = createWrapper(kamUser);
    const { result } = renderHook(() => useAdminFeatures(), { wrapper });

    expect(result.current.canManageUsers).toBe(false);
    expect(result.current.canManageSettings).toBe(false);
    expect(result.current.canViewCommissions).toBe(false);
    expect(result.current.canViewLeads).toBe(true);
    expect(result.current.canViewQuotations).toBe(true);
    expect(result.current.showAdminBadge).toBe(false);
    expect(result.current.showTerritoryInfo).toBe(true);
  });

  it('should return no features for unauthenticated users', () => {
    const wrapper = createWrapper(null);
    const { result } = renderHook(() => useAdminFeatures(), { wrapper });

    expect(result.current.canManageUsers).toBe(false);
    expect(result.current.canViewLeads).toBe(false);
    expect(result.current.showAdminBadge).toBe(false);
  });
});

describe('useTerritoryDisplay Hook', () => {
  it('should show "All Territories" for admin users', () => {
    const wrapper = createWrapper(adminUser);
    const { result } = renderHook(() => useTerritoryDisplay(), { wrapper });

    expect(result.current.displayText).toBe('All Territories');
    expect(result.current.hasFullAccess).toBe(true);
    expect(result.current.territoryCount).toBeGreaterThan(0);
  });

  it('should show specific territories for KAM users', () => {
    const wrapper = createWrapper(kamUser);
    const { result } = renderHook(() => useTerritoryDisplay(), { wrapper });

    expect(result.current.displayText).toBe('North, Northeast');
    expect(result.current.hasFullAccess).toBe(false);
    expect(result.current.territoryCount).toBe(2);
    expect(result.current.territories).toEqual(['North', 'Northeast']);
  });

  it('should show "No Access" for unauthenticated users', () => {
    const wrapper = createWrapper(null);
    const { result } = renderHook(() => useTerritoryDisplay(), { wrapper });

    expect(result.current.displayText).toBe('No Access');
    expect(result.current.hasFullAccess).toBe(false);
    expect(result.current.territoryCount).toBe(0);
  });

  it('should handle users with no territories', () => {
    const userWithoutTerritories = { ...kamUser, territories: [] };
    const wrapper = createWrapper(userWithoutTerritories);
    const { result } = renderHook(() => useTerritoryDisplay(), { wrapper });

    expect(result.current.displayText).toBe('No Territories');
    expect(result.current.territoryCount).toBe(0);
  });
});

describe('useConditionalRender Hook', () => {
  it('should render when user meets role requirements', () => {
    const wrapper = createWrapper(adminUser);
    const { result } = renderHook(() => useConditionalRender(['admin']), {
      wrapper,
    });

    expect(result.current).toBe(true);
  });

  it('should not render when user does not meet role requirements', () => {
    const wrapper = createWrapper(kamUser);
    const { result } = renderHook(() => useConditionalRender(['admin']), {
      wrapper,
    });

    expect(result.current).toBe(false);
  });

  it('should render when user meets territory requirements', () => {
    const wrapper = createWrapper(kamUser);
    const { result } = renderHook(
      () => useConditionalRender(undefined, ['North']),
      { wrapper }
    );

    expect(result.current).toBe(true);
  });

  it('should not render when user does not meet territory requirements', () => {
    const wrapper = createWrapper(kamUser);
    const { result } = renderHook(
      () => useConditionalRender(undefined, ['South']),
      { wrapper }
    );

    expect(result.current).toBe(false);
  });

  it('should render when both role and territory requirements are met', () => {
    const wrapper = createWrapper(kamUser);
    const { result } = renderHook(
      () => useConditionalRender(['kam'], ['North']),
      { wrapper }
    );

    expect(result.current).toBe(true);
  });

  it('should not render when role is met but territory is not', () => {
    const wrapper = createWrapper(kamUser);
    const { result } = renderHook(
      () => useConditionalRender(['kam'], ['South']),
      { wrapper }
    );

    expect(result.current).toBe(false);
  });

  it('should render when no requirements are specified', () => {
    const wrapper = createWrapper(kamUser);
    const { result } = renderHook(() => useConditionalRender(), { wrapper });

    expect(result.current).toBe(true);
  });

  it('should not render for unauthenticated users', () => {
    const wrapper = createWrapper(null);
    const { result } = renderHook(() => useConditionalRender(['admin']), {
      wrapper,
    });

    expect(result.current).toBe(false);
  });
});

describe('Hook Performance and Memoization', () => {
  it('should not re-render unnecessarily when user data does not change', () => {
    const wrapper = createWrapper(adminUser);
    const { result, rerender } = renderHook(() => useAdminFeatures(), {
      wrapper,
    });

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult); // Should be the same reference due to memoization
  });
});
