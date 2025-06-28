/**
 * Lead access guard utility
 * Provides client-side validation for lead access based on territory and role
 * Works in conjunction with server-side validation for defense in depth
 */

import type { User, Territory } from '../types/user.types';
import type { Lead } from '../types/lead.types';
import { getUserTerritoryAccess } from './territory';

/**
 * Access validation result interface
 */
export interface AccessValidationResult {
  hasAccess: boolean;
  reason?: 'NO_USER' | 'INVALID_ROLE' | 'INVALID_TERRITORY' | 'LEAD_NOT_FOUND';
  message?: string;
}

/**
 * Check if user can access a specific lead
 * @param user - Current user object
 * @param lead - Lead object to check access for
 * @returns Access validation result
 */
export const assertLeadAccess = (
  user: User | null,
  lead: Lead | null
): AccessValidationResult => {
  // No user authenticated
  if (!user) {
    return {
      hasAccess: false,
      reason: 'NO_USER',
      message: 'User not authenticated',
    };
  }

  // Lead not found
  if (!lead) {
    return {
      hasAccess: false,
      reason: 'LEAD_NOT_FOUND',
      message: 'Lead not found',
    };
  }

  // Admin has access to all leads
  if ((user.role as string) === 'admin') {
    return { hasAccess: true };
  }

  // Check role-based access
  const allowedRoles = ['admin', 'kam', 'cp'];
  if (!allowedRoles.includes(user.role)) {
    return {
      hasAccess: false,
      reason: 'INVALID_ROLE',
      message: `Role '${user.role}' cannot access leads`,
    };
  }

  // For CP users, check if they are assigned to this lead
  if (user.role === 'cp') {
    if (lead.assignedTo === user.id) {
      return { hasAccess: true };
    } else {
      return {
        hasAccess: false,
        reason: 'INVALID_TERRITORY',
        message: 'Lead is not assigned to your account',
      };
    }
  }

  // For KAM users, check territory access
  if (user.role === 'kam') {
    const territoryAccess = getUserTerritoryAccess(user);

    // If lead has no territory, KAM can access it (global leads)
    if (!lead.territory) {
      return { hasAccess: true };
    }

    // Check if KAM has access to lead's territory
    if (territoryAccess.canAccessTerritory(lead.territory)) {
      return { hasAccess: true };
    } else {
      return {
        hasAccess: false,
        reason: 'INVALID_TERRITORY',
        message: `Lead is in territory '${lead.territory}' which is outside your assigned territories: ${territoryAccess.territories.join(', ')}`,
      };
    }
  }

  // Default fallback
  return { hasAccess: true };
};

/**
 * Check if user can access leads in specific territories
 * @param user - Current user object
 * @param territories - Array of territories to check
 * @returns Access validation result
 */
export const assertTerritoryAccess = (
  user: User | null,
  territories: Territory[]
): AccessValidationResult => {
  if (!user) {
    return {
      hasAccess: false,
      reason: 'NO_USER',
      message: 'User not authenticated',
    };
  }

  // Admin has access to all territories
  if ((user.role as string) === 'admin') {
    return { hasAccess: true };
  }

  // For KAM users, check territory access
  if (user.role === 'kam') {
    const territoryAccess = getUserTerritoryAccess(user);
    const hasAccessToAll = territories.every(territory =>
      territoryAccess.canAccessTerritory(territory)
    );

    if (hasAccessToAll) {
      return { hasAccess: true };
    } else {
      const inaccessibleTerritories = territories.filter(
        territory => !territoryAccess.canAccessTerritory(territory)
      );
      return {
        hasAccess: false,
        reason: 'INVALID_TERRITORY',
        message: `Cannot access territories: ${inaccessibleTerritories.join(', ')}. Your assigned territories: ${territoryAccess.territories.join(', ')}`,
      };
    }
  }

  return { hasAccess: true };
};

/**
 * Filter leads array based on user's access permissions
 * @param user - Current user object
 * @param leads - Array of leads to filter
 * @returns Filtered array of accessible leads
 */
export const filterLeadsByAccess = (
  user: User | null,
  leads: Lead[]
): Lead[] => {
  if (!user || !leads.length) {
    return [];
  }

  // Admin can see all leads
  if ((user.role as string) === 'admin') {
    return leads;
  }

  return leads.filter(lead => {
    const accessResult = assertLeadAccess(user, lead);
    return accessResult.hasAccess;
  });
};

/**
 * Check if user can perform specific actions on leads
 * @param user - Current user object
 * @param action - Action to check ('read', 'write', 'delete', 'reassign')
 * @param lead - Lead object (optional for general action checks)
 * @returns Access validation result
 */
export const assertLeadActionAccess = (
  user: User | null,
  action: 'read' | 'write' | 'delete' | 'reassign',
  lead?: Lead | null
): AccessValidationResult => {
  if (!user) {
    return {
      hasAccess: false,
      reason: 'NO_USER',
      message: 'User not authenticated',
    };
  }

  // Check basic lead access first if lead is provided
  if (lead) {
    const leadAccess = assertLeadAccess(user, lead);
    if (!leadAccess.hasAccess) {
      return leadAccess;
    }
  }

  // Admin can perform all actions
  if ((user.role as string) === 'admin') {
    return { hasAccess: true };
  }

  // Action-specific permissions
  switch (action) {
    case 'read':
      // All authenticated users can read leads they have access to
      return { hasAccess: true };

    case 'write':
      // KAM and Admin can write/update leads
      if (['admin', 'kam'].includes(user.role)) {
        return { hasAccess: true };
      }
      // CP can only update leads assigned to them
      if (user.role === 'cp' && lead && lead.assignedTo === user.id) {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        reason: 'INVALID_ROLE',
        message: 'You do not have permission to modify this lead',
      };

    case 'delete':
      // Only Admin can delete leads
      if ((user.role as string) === 'admin') {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        reason: 'INVALID_ROLE',
        message: 'Only administrators can delete leads',
      };

    case 'reassign':
      // Only Admin and KAM can reassign leads
      if (['admin', 'kam'].includes(user.role)) {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        reason: 'INVALID_ROLE',
        message: 'You do not have permission to reassign leads',
      };

    default:
      return {
        hasAccess: false,
        reason: 'INVALID_ROLE',
        message: `Unknown action: ${action}`,
      };
  }
};

/**
 * Utility functions object for easier consumption
 */
export const leadAccessGuard = {
  assertLeadAccess,
  assertTerritoryAccess,
  assertLeadActionAccess,
  filterLeadsByAccess,
};

export default leadAccessGuard;
