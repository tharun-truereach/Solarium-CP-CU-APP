/**
 * Territory filtering hook
 * Provides client-side territory filtering for UI components
 */

import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  selectUser,
  selectUserTerritoryAccess,
} from '../store/slices/authSlice';
import { filterDataByTerritory } from '../utils/territory';
import type { Territory } from '../types/user.types';

/**
 * Interface for data items that can be filtered by territory
 */
interface TerritoryFilterable {
  territory?: Territory;
  territories?: Territory[];
}

/**
 * Hook to filter data arrays based on user's territory access
 */
export function useTerritoryFilter<T extends TerritoryFilterable>(
  data: T[] | undefined
): T[] {
  const user = useAppSelector(selectUser);
  const territoryAccess = useAppSelector(selectUserTerritoryAccess);

  return useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Admin has full access - return all data
    if (territoryAccess.hasFullAccess) {
      return data;
    }

    // Filter data based on territory access
    return data.filter(item => {
      // If item has no territory, include it (global data)
      if (!item.territory && !item.territories) {
        return true;
      }

      // Check single territory
      if (item.territory) {
        return territoryAccess.canAccessTerritory(item.territory);
      }

      // Check multiple territories (item has access if user can access any of them)
      if (item.territories && Array.isArray(item.territories)) {
        return item.territories.some(territory =>
          territoryAccess.canAccessTerritory(territory)
        );
      }

      return false;
    });
  }, [data, territoryAccess]);
}

/**
 * Hook to check if user can access specific territory
 */
export function useCanAccessTerritory(): (territory: Territory) => boolean {
  const territoryAccess = useAppSelector(selectUserTerritoryAccess);

  return useMemo(() => {
    return (territory: Territory) =>
      territoryAccess.canAccessTerritory(territory);
  }, [territoryAccess]);
}

/**
 * Hook to get user's accessible territories
 */
export function useAccessibleTerritories(): Territory[] {
  const territoryAccess = useAppSelector(selectUserTerritoryAccess);
  return territoryAccess.territories;
}

/**
 * Hook to check if user has full territory access
 */
export function useHasFullTerritoryAccess(): boolean {
  const territoryAccess = useAppSelector(selectUserTerritoryAccess);
  return territoryAccess.hasFullAccess;
}

/**
 * Hook for territory-aware data counting
 */
export function useTerritoryFilteredCount<T extends TerritoryFilterable>(
  data: T[] | undefined
): {
  total: number;
  accessible: number;
  filtered: number;
} {
  const filteredData = useTerritoryFilter(data);

  return useMemo(
    () => ({
      total: data?.length || 0,
      accessible: filteredData.length,
      filtered: (data?.length || 0) - filteredData.length,
    }),
    [data, filteredData]
  );
}

/**
 * Hook for territory statistics
 */
export function useTerritoryStats(): {
  userTerritories: Territory[];
  totalTerritories: number;
  hasFullAccess: boolean;
  accessibleCount: number;
} {
  const user = useAppSelector(selectUser);
  const territoryAccess = useAppSelector(selectUserTerritoryAccess);

  return useMemo(
    () => ({
      userTerritories: user?.territories || [],
      totalTerritories: 9, // Total number of territories
      hasFullAccess: territoryAccess.hasFullAccess,
      accessibleCount: territoryAccess.territories.length,
    }),
    [user, territoryAccess]
  );
}

export default useTerritoryFilter;
