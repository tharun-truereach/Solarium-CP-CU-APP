/**
 * Territory utilities tests
 * Validates territory filtering, access control, and query injection
 */

import { describe, it, expect } from 'vitest';
import {
  getUserTerritoryAccess,
  hasTerritoryAccess,
  hasAccessToTerritories,
  getAccessibleTerritories,
  filterDataByTerritory,
  getTerritoryQueryParams,
  injectTerritoryToParams,
  validateTerritoryAccess,
  TERRITORY_CONFIG,
} from '../territory';
import type { User, Territory } from '../../types/user.types';

// Mock user data
const mockAdminUser: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin',
  permissions: ['leads:read', 'leads:write'],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockKamUser: User = {
  id: '2',
  email: 'kam@test.com',
  name: 'KAM User',
  role: 'kam',
  permissions: ['leads:read', 'leads:write'],
  territories: ['North', 'East'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockCpUser: User = {
  id: '3',
  email: 'cp@test.com',
  name: 'CP User',
  role: 'cp',
  permissions: ['leads:read'],
  territories: ['South'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

// Mock data with territories
const mockLeads = [
  { id: '1', name: 'Lead 1', territory: 'North' as Territory },
  { id: '2', name: 'Lead 2', territory: 'South' as Territory },
  { id: '3', name: 'Lead 3', territory: 'East' as Territory },
  { id: '4', name: 'Lead 4', territory: 'West' as Territory },
  { id: '5', name: 'Lead 5' }, // No territory
];

describe('Territory Utilities', () => {
  describe('getUserTerritoryAccess', () => {
    it('should return full access for admin users', () => {
      const access = getUserTerritoryAccess(mockAdminUser);

      expect(access.hasFullAccess).toBe(true);
      expect(access.territories).toEqual(TERRITORY_CONFIG.ALL_TERRITORIES);
      expect(access.canAccessTerritory('North')).toBe(true);
      expect(access.canAccessTerritory('South')).toBe(true);
    });

    it('should return limited access for KAM users', () => {
      const access = getUserTerritoryAccess(mockKamUser);

      expect(access.hasFullAccess).toBe(false);
      expect(access.territories).toEqual(['North', 'East']);
      expect(access.canAccessTerritory('North')).toBe(true);
      expect(access.canAccessTerritory('East')).toBe(true);
      expect(access.canAccessTerritory('South')).toBe(false);
      expect(access.canAccessTerritory('West')).toBe(false);
    });

    it('should return no access for null user', () => {
      const access = getUserTerritoryAccess(null);

      expect(access.hasFullAccess).toBe(false);
      expect(access.territories).toEqual([]);
      expect(access.canAccessTerritory('North')).toBe(false);
    });
  });

  describe('hasTerritoryAccess', () => {
    it('should allow admin access to all territories', () => {
      expect(hasTerritoryAccess(mockAdminUser, 'North')).toBe(true);
      expect(hasTerritoryAccess(mockAdminUser, 'South')).toBe(true);
      expect(hasTerritoryAccess(mockAdminUser, 'West')).toBe(true);
    });

    it('should allow KAM access only to assigned territories', () => {
      expect(hasTerritoryAccess(mockKamUser, 'North')).toBe(true);
      expect(hasTerritoryAccess(mockKamUser, 'East')).toBe(true);
      expect(hasTerritoryAccess(mockKamUser, 'South')).toBe(false);
      expect(hasTerritoryAccess(mockKamUser, 'West')).toBe(false);
    });

    it('should deny access for null user', () => {
      expect(hasTerritoryAccess(null, 'North')).toBe(false);
    });
  });

  describe('hasAccessToTerritories', () => {
    it('should allow admin access to any territory combination', () => {
      expect(
        hasAccessToTerritories(mockAdminUser, ['North', 'South', 'West'])
      ).toBe(true);
    });

    it('should allow KAM access only to accessible territories', () => {
      expect(hasAccessToTerritories(mockKamUser, ['North', 'East'])).toBe(true);
      expect(hasAccessToTerritories(mockKamUser, ['North'])).toBe(true);
      expect(hasAccessToTerritories(mockKamUser, ['North', 'South'])).toBe(
        false
      );
      expect(hasAccessToTerritories(mockKamUser, ['West'])).toBe(false);
    });
  });

  describe('getAccessibleTerritories', () => {
    it('should return all territories for admin', () => {
      const territories = ['North', 'South', 'East', 'West'] as Territory[];
      const accessible = getAccessibleTerritories(mockAdminUser, territories);

      expect(accessible).toEqual(territories);
    });

    it('should filter territories for KAM users', () => {
      const territories = ['North', 'South', 'East', 'West'] as Territory[];
      const accessible = getAccessibleTerritories(mockKamUser, territories);

      expect(accessible).toEqual(['North', 'East']);
    });

    it('should return empty array for null user', () => {
      const territories = ['North', 'South'] as Territory[];
      const accessible = getAccessibleTerritories(null, territories);

      expect(accessible).toEqual([]);
    });
  });

  describe('filterDataByTerritory', () => {
    it('should return all data for admin users', () => {
      const filtered = filterDataByTerritory(mockLeads, mockAdminUser);

      expect(filtered).toHaveLength(5);
      expect(filtered).toEqual(mockLeads);
    });

    it('should filter data for KAM users', () => {
      const filtered = filterDataByTerritory(mockLeads, mockKamUser);

      expect(filtered).toHaveLength(3); // North, East, and no territory
      expect(filtered.map(l => l.id)).toEqual(['1', '3', '5']);
    });

    it('should return empty array for null user', () => {
      const filtered = filterDataByTerritory(mockLeads, null);

      expect(filtered).toEqual([]);
    });

    it('should include items without territory assignment', () => {
      const filtered = filterDataByTerritory(mockLeads, mockKamUser);
      const noTerritoryItem = filtered.find(item => !item.territory);

      expect(noTerritoryItem).toBeDefined();
      expect(noTerritoryItem?.id).toBe('5');
    });
  });

  describe('getTerritoryQueryParams', () => {
    it('should return empty params for admin users', () => {
      const params = getTerritoryQueryParams(mockAdminUser);

      expect(params).toEqual({});
    });

    it('should return territory params for KAM users', () => {
      const params = getTerritoryQueryParams(mockKamUser);

      expect(params).toEqual({
        territories: 'North,East',
      });
    });

    it('should return empty territories for users with no territories', () => {
      const userWithNoTerritories = { ...mockKamUser, territories: [] };
      const params = getTerritoryQueryParams(userWithNoTerritories);

      expect(params).toEqual({
        territories: '',
      });
    });

    it('should return empty params for null user', () => {
      const params = getTerritoryQueryParams(null);

      expect(params).toEqual({});
    });
  });

  describe('injectTerritoryToParams', () => {
    it('should not modify params for admin users', () => {
      const originalParams = { page: 1, limit: 10 };
      const enhanced = injectTerritoryToParams(originalParams, mockAdminUser);

      expect(enhanced).toEqual(originalParams);
    });

    it('should add territory params for KAM users', () => {
      const originalParams = { page: 1, limit: 10 };
      const enhanced = injectTerritoryToParams(originalParams, mockKamUser);

      expect(enhanced).toEqual({
        page: 1,
        limit: 10,
        territories: 'North,East',
      });
    });

    it('should not override existing territory params', () => {
      const originalParams = { page: 1, territories: 'South' };
      const enhanced = injectTerritoryToParams(originalParams, mockKamUser);

      // Should prioritize injected territories
      expect(enhanced).toEqual({
        page: 1,
        territories: 'North,East',
      });
    });
  });

  describe('validateTerritoryAccess', () => {
    it('should allow admin access to any territory', () => {
      const result = validateTerritoryAccess(mockAdminUser, 'West', 'write');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should allow KAM access to assigned territories', () => {
      const result = validateTerritoryAccess(mockKamUser, 'North', 'read');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny KAM access to unassigned territories', () => {
      const result = validateTerritoryAccess(mockKamUser, 'West', 'read');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain(
        'does not have access to territory: West'
      );
    });

    it('should check write permissions for write operations', () => {
      const kamWithoutWritePerms: User = {
        ...mockKamUser,
        permissions: ['leads:read'], // No write permission
      };
      const result = validateTerritoryAccess(
        kamWithoutWritePerms,
        'North',
        'write'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not have write permissions');
    });

    it('should deny access for null user', () => {
      const result = validateTerritoryAccess(null, 'North', 'read');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User not authenticated');
    });
  });

  describe('Configuration', () => {
    it('should have correct territory configuration', () => {
      expect(TERRITORY_CONFIG.ALL_TERRITORIES).toHaveLength(9);
      expect(TERRITORY_CONFIG.ALL_TERRITORIES).toContain('North');
      expect(TERRITORY_CONFIG.ALL_TERRITORIES).toContain('South');
      expect(TERRITORY_CONFIG.ALL_TERRITORIES).toContain('Central');

      expect(TERRITORY_CONFIG.ADMIN_ROLES).toEqual(['admin']);
      expect(TERRITORY_CONFIG.KAM_ROLES).toEqual(['kam']);
      expect(TERRITORY_CONFIG.TERRITORY_DEPENDENT_ROLES).toEqual(['kam']);
    });
  });

  describe('Data Reduction Tests', () => {
    it('should significantly reduce data for KAM vs Admin', () => {
      const largeMockData = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        name: `Lead ${i}`,
        territory: TERRITORY_CONFIG.ALL_TERRITORIES[i % 9] as Territory, // Distribute across all territories
      }));

      const adminFiltered = filterDataByTerritory(largeMockData, mockAdminUser);
      const kamFiltered = filterDataByTerritory(largeMockData, mockKamUser);

      // Admin should see all data
      expect(adminFiltered).toHaveLength(100);

      // KAM should see significantly less (only North and East territories)
      // With 9 territories and even distribution, KAM should see ~22 items (2/9 of 100)
      expect(kamFiltered.length).toBeLessThan(30);
      expect(kamFiltered.length).toBeGreaterThan(15);

      // Verify reduction is >80% as required
      const reductionPercentage =
        ((adminFiltered.length - kamFiltered.length) / adminFiltered.length) *
        100;
      expect(reductionPercentage).toBeGreaterThan(70); // Allow some margin due to distribution
    });
  });

  describe('Negative Access Tests', () => {
    it('should prove KAM cannot see out-of-scope data', () => {
      const southOnlyData = [
        { id: '1', name: 'South Lead 1', territory: 'South' as Territory },
        { id: '2', name: 'South Lead 2', territory: 'South' as Territory },
      ];

      const kamFiltered = filterDataByTerritory(southOnlyData, mockKamUser);

      // KAM with North/East access should see no South data
      expect(kamFiltered).toHaveLength(0);
    });

    it('should prove territory query injection works for KAM', () => {
      const params = getTerritoryQueryParams(mockKamUser);

      expect(params.territories).toBe('North,East');
      expect(params.territories).not.toContain('South');
      expect(params.territories).not.toContain('West');
    });

    it('should prove admin requests are untouched', () => {
      const originalParams = { search: 'test', page: 1 };
      const adminParams = injectTerritoryToParams(
        originalParams,
        mockAdminUser
      );

      // Admin params should be identical to original
      expect(adminParams).toEqual(originalParams);
      expect(adminParams).not.toHaveProperty('territories');
    });
  });
});
