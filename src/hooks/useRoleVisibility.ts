/**
 * Hook for determining UI element visibility based on user role and territory access
 * Provides centralized logic for role-based UI rendering
 */
import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  selectUser,
  selectUserRole,
  selectIsAdmin,
  selectIsKAM,
} from '../store/slices/authSlice';
import {
  getUserTerritoryAccess,
  hasAnyTerritoryAccess,
} from '../utils/territory';
import type { RouteInfo } from '../routes/routes';
import type { Territory } from '../types/user.types';

/**
 * Hook to determine if a route should be visible to the current user
 * @param routeInfo - Route information including role and territory requirements
 * @returns True if route should be visible to current user
 */
export const useRoleVisibility = (routeInfo: RouteInfo): boolean => {
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);

  return useMemo(() => {
    // If no user is authenticated, hide all protected routes
    if (!user || !userRole) {
      return !routeInfo.requiresAuth;
    }

    // Check role-based access
    if (routeInfo.allowedRoles && routeInfo.allowedRoles.length > 0) {
      if (!routeInfo.allowedRoles.includes(userRole)) {
        return false; // User role not in allowed roles
      }
    }

    // Check territory-based access (if specified)
    if (
      routeInfo.requiredTerritories &&
      routeInfo.requiredTerritories.length > 0
    ) {
      if (!hasAnyTerritoryAccess(user, routeInfo.requiredTerritories)) {
        return false; // User doesn't have access to required territories
      }
    }

    return true; // All checks passed, route is visible
  }, [user, userRole, routeInfo]);
};

/**
 * Hook to get navigation items filtered by user role and territory access
 * @param navigationItems - Array of route info objects
 * @returns Filtered array of visible navigation items
 */
export const useFilteredNavigation = (
  navigationItems: RouteInfo[]
): RouteInfo[] => {
  const user = useAppSelector(selectUser);

  return useMemo(() => {
    if (!user) {
      return navigationItems.filter(item => !item.requiresAuth);
    }

    return navigationItems.filter(item => {
      // Check if item should show in navigation first
      if (!item.showInNavigation) {
        return false;
      }

      // Use role visibility logic
      // Create a temporary hook call within the filter - this is a custom implementation
      // since we can't call hooks inside loops normally
      return item.allowedRoles ? item.allowedRoles.includes(user.role) : true;
    });
  }, [user, navigationItems]);
};

/**
 * Hook to determine admin-only feature visibility
 * @returns Object with admin feature visibility flags
 */
export const useAdminFeatures = () => {
  const isAdmin = useAppSelector(selectIsAdmin);
  const isKAM = useAppSelector(selectIsKAM);

  return useMemo(
    () => ({
      // Core admin features
      canManageUsers: isAdmin,
      canManageSettings: isAdmin,
      canViewCommissions: isAdmin,
      canManageMasterData: isAdmin,

      // Shared features with different access levels
      canViewLeads: isAdmin || isKAM,
      canViewQuotations: isAdmin || isKAM,
      canViewChannelPartners: isAdmin || isKAM,
      canViewCustomers: isAdmin || isKAM,

      // UI display flags
      showAdminBadge: isAdmin,
      showTerritoryInfo: isKAM, // KAM users see territory info, admin sees "All"
      showAdvancedReports: isAdmin,
      showSystemStatus: isAdmin,
    }),
    [isAdmin, isKAM]
  );
};

/**
 * Hook to get user territory information for display
 * @returns Territory display information
 */
export const useTerritoryDisplay = () => {
  const user = useAppSelector(selectUser);
  const isAdmin = useAppSelector(selectIsAdmin);

  return useMemo(() => {
    if (!user) {
      return {
        territories: [],
        displayText: 'No Access',
        hasFullAccess: false,
        territoryCount: 0,
      };
    }

    const territoryAccess = getUserTerritoryAccess(user);

    if (isAdmin || territoryAccess.hasFullAccess) {
      return {
        territories: territoryAccess.territories,
        displayText: 'All Territories',
        hasFullAccess: true,
        territoryCount: territoryAccess.territories.length,
      };
    }

    const userTerritories = territoryAccess.territories;

    return {
      territories: userTerritories,
      displayText:
        userTerritories.length > 0
          ? userTerritories.join(', ')
          : 'No Territories',
      hasFullAccess: false,
      territoryCount: userTerritories.length,
    };
  }, [user, isAdmin]);
};

/**
 * Hook for conditional UI rendering based on permissions
 * @param requiredRoles - Roles required to show the UI element
 * @param requiredTerritories - Territories required to show the UI element
 * @returns True if UI element should be rendered
 */
export const useConditionalRender = (
  requiredRoles?: string[],
  requiredTerritories?: Territory[]
): boolean => {
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);

  return useMemo(() => {
    if (!user || !userRole) {
      return false;
    }

    // Check role requirements
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(userRole)) {
        return false;
      }
    }

    // Check territory requirements
    if (requiredTerritories && requiredTerritories.length > 0) {
      if (!hasAnyTerritoryAccess(user, requiredTerritories)) {
        return false;
      }
    }

    return true;
  }, [user, userRole, requiredRoles, requiredTerritories]);
};

/**
 * Export all hooks for easy import
 */
export default {
  useRoleVisibility,
  useFilteredNavigation,
  useAdminFeatures,
  useTerritoryDisplay,
  useConditionalRender,
};
