/**
 * Hook for lead access validation and management
 * Provides client-side access control and validation utilities
 */

import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';
import {
  assertLeadAccess,
  assertTerritoryAccess,
  assertLeadActionAccess,
  filterLeadsByAccess,
  type AccessValidationResult,
} from '../utils/leadAccessGuard';
import type { Lead } from '../types/lead.types';
import type { Territory } from '../types/user.types';

/**
 * Hook return interface
 */
export interface UseLeadAccessReturn {
  // Access validation functions
  canAccessLead: (lead: Lead | null) => AccessValidationResult;
  canAccessTerritories: (territories: Territory[]) => AccessValidationResult;
  canPerformAction: (
    action: 'read' | 'write' | 'delete' | 'reassign',
    lead?: Lead | null
  ) => AccessValidationResult;

  // Filtering utilities
  filterAccessibleLeads: (leads: Lead[]) => Lead[];

  // User context
  user: any;
  isAdmin: boolean;
  isKAM: boolean;
  isCP: boolean;

  // Territory info
  userTerritories: Territory[];
  hasFullAccess: boolean;
}

/**
 * Custom hook for lead access control
 */
export const useLeadAccess = (): UseLeadAccessReturn => {
  const user = useAppSelector(selectUser);

  // Memoized access functions to prevent unnecessary re-renders
  const canAccessLead = useMemo(
    () => (lead: Lead | null) => assertLeadAccess(user, lead),
    [user]
  );

  const canAccessTerritories = useMemo(
    () => (territories: Territory[]) =>
      assertTerritoryAccess(user, territories),
    [user]
  );

  const canPerformAction = useMemo(
    () =>
      (action: 'read' | 'write' | 'delete' | 'reassign', lead?: Lead | null) =>
        assertLeadActionAccess(user, action, lead),
    [user]
  );

  const filterAccessibleLeads = useMemo(
    () => (leads: Lead[]) => filterLeadsByAccess(user, leads),
    [user]
  );

  // User role checks
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);
  const isKAM = useMemo(() => user?.role === 'kam', [user]);
  const isCP = useMemo(() => user?.role === 'cp', [user]);

  // Territory info
  const userTerritories = useMemo(() => user?.territories || [], [user]);
  const hasFullAccess = useMemo(() => isAdmin, [isAdmin]);

  return {
    canAccessLead,
    canAccessTerritories,
    canPerformAction,
    filterAccessibleLeads,
    user,
    isAdmin,
    isKAM,
    isCP,
    userTerritories,
    hasFullAccess,
  };
};

export default useLeadAccess;
