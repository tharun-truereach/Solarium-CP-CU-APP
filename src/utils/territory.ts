/**
 * Territory management utilities
 * Provides territory filtering, query injection, and access control functionality
 */

import type {
  User,
  UserRole,
  Territory,
  TerritoryAccess,
} from '../types/user.types';

/**
 * Territory configuration and constants
 */
export const TERRITORY_CONFIG = {
  ALL_TERRITORIES: [
    'North',
    'South',
    'East',
    'West',
    'Central',
    'Northeast',
    'Northwest',
    'Southeast',
    'Southwest',
  ] as Territory[],

  ADMIN_ROLES: ['admin'] as UserRole[],
  KAM_ROLES: ['kam'] as UserRole[],
  TERRITORY_DEPENDENT_ROLES: ['kam'] as UserRole[],
} as const;

/**
 * Get user's territory access information
 */
export function getUserTerritoryAccess(user: User | null): TerritoryAccess {
  if (!user) {
    return {
      territories: [],
      hasFullAccess: false,
      canAccessTerritory: () => false,
    };
  }

  const hasFullAccess = TERRITORY_CONFIG.ADMIN_ROLES.includes(user.role);
  const territories = hasFullAccess
    ? TERRITORY_CONFIG.ALL_TERRITORIES
    : user.territories || [];

  return {
    territories,
    hasFullAccess,
    canAccessTerritory: (territory: Territory) => {
      return hasFullAccess || territories.includes(territory);
    },
  };
}

/**
 * Check if user has territory access
 */
export function hasTerritoryAccess(
  user: User | null,
  territory: Territory
): boolean {
  const access = getUserTerritoryAccess(user);
  return access.canAccessTerritory(territory);
}

/**
 * Check if user can access multiple territories
 */
export function hasAccessToTerritories(
  user: User | null,
  territories: Territory[]
): boolean {
  const access = getUserTerritoryAccess(user);
  return territories.every(territory => access.canAccessTerritory(territory));
}

/**
 * Get territories that user can access from a given list
 */
export function getAccessibleTerritories(
  user: User | null,
  territories: Territory[]
): Territory[] {
  const access = getUserTerritoryAccess(user);
  return territories.filter(territory => access.canAccessTerritory(territory));
}

/**
 * Filter data array by user's territory access
 */
export function filterDataByTerritory<T extends { territory?: Territory }>(
  data: T[],
  user: User | null
): T[] {
  const access = getUserTerritoryAccess(user);

  if (access.hasFullAccess) {
    return data;
  }

  return data.filter(item => {
    if (!item.territory) {
      return true; // Include items without territory assignment
    }
    return access.canAccessTerritory(item.territory);
  });
}

/**
 * Build territory query parameters for API calls
 */
export function getTerritoryQueryParams(
  user: User | null
): Record<string, string> {
  const access = getUserTerritoryAccess(user);

  if (access.hasFullAccess) {
    return {}; // No territory filtering for admin
  }

  if (access.territories.length === 0) {
    return { territories: '' }; // No territories assigned
  }

  return {
    territories: access.territories.join(','),
  };
}

/**
 * Inject territory parameters into query object
 */
export function injectTerritoryToParams(
  params: Record<string, any>,
  user: User | null
): Record<string, any> {
  const territoryParams = getTerritoryQueryParams(user);
  return { ...params, ...territoryParams };
}

/**
 * Build territory filter for API headers
 */
export function getTerritoryHeaders(user: User | null): Record<string, string> {
  const access = getUserTerritoryAccess(user);

  if (access.hasFullAccess) {
    return {
      'X-Territory-Access': 'all',
    };
  }

  return {
    'X-Territory-Access': 'filtered',
    'X-User-Territories': access.territories.join(','),
  };
}

/**
 * Validate territory access for data modification
 */
export function validateTerritoryAccess(
  user: User | null,
  targetTerritory: Territory,
  operation: 'read' | 'write' | 'delete' = 'read'
): { allowed: boolean; reason?: string } {
  if (!user) {
    return {
      allowed: false,
      reason: 'User not authenticated',
    };
  }

  const access = getUserTerritoryAccess(user);

  if (access.hasFullAccess) {
    return { allowed: true };
  }

  if (!access.canAccessTerritory(targetTerritory)) {
    return {
      allowed: false,
      reason: `User does not have access to territory: ${targetTerritory}`,
    };
  }

  // Additional permission checks based on operation
  if (operation === 'write' || operation === 'delete') {
    const hasWritePermission =
      user.permissions.includes('leads:write') ||
      user.permissions.includes('leads:delete');

    if (!hasWritePermission) {
      return {
        allowed: false,
        reason: `User does not have ${operation} permissions`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Get territory statistics for user
 */
export function getTerritoryStats(user: User | null): {
  totalTerritories: number;
  assignedTerritories: number;
  accessibleTerritories: Territory[];
  hasFullAccess: boolean;
} {
  const access = getUserTerritoryAccess(user);

  return {
    totalTerritories: TERRITORY_CONFIG.ALL_TERRITORIES.length,
    assignedTerritories: access.territories.length,
    accessibleTerritories: access.territories,
    hasFullAccess: access.hasFullAccess,
  };
}

/**
 * Format territory display name
 */
export function formatTerritoryName(territory: Territory): string {
  return territory;
}

/**
 * Get territory color for UI display
 */
export function getTerritoryColor(territory: Territory): string {
  const colorMap: Record<Territory, string> = {
    North: '#1976d2',
    South: '#d32f2f',
    East: '#388e3c',
    West: '#f57c00',
    Central: '#7b1fa2',
    Northeast: '#0288d1',
    Northwest: '#1565c0',
    Southeast: '#2e7d32',
    Southwest: '#ef6c00',
  };

  return colorMap[territory] || '#666666';
}

/**
 * Territory utilities object for easy importing
 */
export const territoryUtils = {
  getUserTerritoryAccess,
  hasTerritoryAccess,
  hasAccessToTerritories,
  getAccessibleTerritories,
  filterDataByTerritory,
  getTerritoryQueryParams,
  injectTerritoryToParams,
  getTerritoryHeaders,
  validateTerritoryAccess,
  getTerritoryStats,
  formatTerritoryName,
  getTerritoryColor,
  TERRITORY_CONFIG,
};

export default territoryUtils;
