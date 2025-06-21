/**
 * Territory utility functions for access control and data filtering
 * Provides comprehensive territory management for KAM vs Admin access patterns
 */

import type { User, Territory, TerritoryAccess } from '../types/user.types';

/**
 * All available territories in the system
 */
export const ALL_TERRITORIES: Territory[] = [
  'North',
  'South',
  'East',
  'West',
  'Central',
  'Northeast',
  'Northwest',
  'Southeast',
  'Southwest',
];

/**
 * Get user's territory access configuration
 * @param user - Current user object
 * @returns Territory access configuration
 */
export const getUserTerritoryAccess = (user: User | null): TerritoryAccess => {
  if (!user) {
    return {
      territories: [],
      hasFullAccess: false,
      canAccessTerritory: () => false,
    };
  }

  // Admin has access to all territories
  if (user.role === 'admin') {
    return {
      territories: ALL_TERRITORIES,
      hasFullAccess: true,
      canAccessTerritory: () => true,
    };
  }

  // KAM and other roles have limited territory access
  const userTerritories = user.territories || [];

  return {
    territories: userTerritories,
    hasFullAccess: false,
    canAccessTerritory: (territory: Territory) =>
      userTerritories.includes(territory),
  };
};

/**
 * Check if user has access to a specific territory
 * @param user - Current user object
 * @param territory - Territory to check access for
 * @returns True if user can access the territory
 */
export const hasTerritoryAccess = (
  user: User | null,
  territory: Territory
): boolean => {
  const access = getUserTerritoryAccess(user);
  return access.canAccessTerritory(territory);
};

/**
 * Check if user has access to any of the required territories
 * @param user - Current user object
 * @param requiredTerritories - Array of territories that are acceptable
 * @returns True if user can access at least one of the required territories
 */
export const hasAnyTerritoryAccess = (
  user: User | null,
  requiredTerritories: Territory[]
): boolean => {
  if (!user || !requiredTerritories || requiredTerritories.length === 0) {
    return false;
  }

  const access = getUserTerritoryAccess(user);

  // Admin has access to all territories
  if (access.hasFullAccess) {
    return true;
  }

  // Check if user has access to any of the required territories
  return requiredTerritories.some(territory =>
    access.canAccessTerritory(territory)
  );
};

/**
 * Get territory query parameters for API requests (KAM filtering)
 * @param user - Current user object
 * @returns Query parameters object for territory filtering
 */
export const getTerritoryQueryParams = (
  user: User | null
): Record<string, any> => {
  if (!user) {
    return {};
  }

  // Admin doesn't need territory filtering
  if (user.role === 'admin') {
    return {};
  }

  // KAM users need territory filtering
  const access = getUserTerritoryAccess(user);
  if (access.territories.length > 0) {
    return {
      territories: access.territories,
    };
  }

  return {};
};

/**
 * Get territory headers for API requests
 * @param user - Current user object
 * @returns Headers object for territory access control
 */
export const getTerritoryHeaders = (
  user: User | null
): Record<string, string> => {
  if (!user) {
    return {};
  }

  const headers: Record<string, string> = {
    'X-User-Role': user.role,
  };

  // Add territory information for non-admin users
  if (user.role !== 'admin') {
    const access = getUserTerritoryAccess(user);
    if (access.territories.length > 0) {
      headers['X-User-Territories'] = access.territories.join(',');
    }
  }

  return headers;
};

/**
 * Filter array of data objects by territory access
 * @param data - Array of objects with territory property
 * @param user - Current user object
 * @returns Filtered array containing only accessible territories
 */
export const filterByTerritory = <T extends { territory: Territory }>(
  data: T[],
  user: User | null
): T[] => {
  if (!user || !data || data.length === 0) {
    return [];
  }

  const access = getUserTerritoryAccess(user);

  // Admin sees all data
  if (access.hasFullAccess) {
    return data;
  }

  // Filter data by user's territory access
  return data.filter(item => access.canAccessTerritory(item.territory));
};

/**
 * Validate territory access for route protection
 * @param user - Current user object
 * @param requiredTerritories - Territories required for route access
 * @param requiredRoles - Roles required for route access
 * @returns Access validation result
 */
export const validateRouteAccess = (
  user: User | null,
  requiredTerritories?: Territory[],
  requiredRoles?: string[]
): {
  hasAccess: boolean;
  reason?: 'NO_USER' | 'INVALID_ROLE' | 'INVALID_TERRITORY';
} => {
  // No user authenticated
  if (!user) {
    return { hasAccess: false, reason: 'NO_USER' };
  }

  // Check role access first
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      return { hasAccess: false, reason: 'INVALID_ROLE' };
    }
  }

  // Check territory access
  if (requiredTerritories && requiredTerritories.length > 0) {
    if (!hasAnyTerritoryAccess(user, requiredTerritories)) {
      return { hasAccess: false, reason: 'INVALID_TERRITORY' };
    }
  }

  return { hasAccess: true };
};

/**
 * Territory utilities object for easier consumption
 */
export const territoryUtils = {
  getAllTerritories: () => ALL_TERRITORIES,
  getUserAccess: getUserTerritoryAccess,
  hasAccess: hasTerritoryAccess,
  hasAnyAccess: hasAnyTerritoryAccess,
  getQueryParams: getTerritoryQueryParams,
  getHeaders: getTerritoryHeaders,
  filterData: filterByTerritory,
  validateRoute: validateRouteAccess,
};

export default territoryUtils;
