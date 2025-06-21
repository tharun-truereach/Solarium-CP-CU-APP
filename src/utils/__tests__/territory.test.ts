/**
 * Test suite for territory utility functions
 * Tests territory access control, filtering, and validation logic
 */
import { describe, it, expect } from 'vitest';
import {
  getUserTerritoryAccess,
  hasTerritoryAccess,
  hasAnyTerritoryAccess,
  getTerritoryQueryParams,
  getTerritoryHeaders,
  filterByTerritory,
  validateRouteAccess,
  ALL_TERRITORIES,
} from '../territory';
import type { User, Territory } from '../../types/user.types';

// Test users
const adminUser: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

const kamUserNorth: User = {
  id: '2',
  email: 'kam@test.com',
  name: 'KAM User',
  role: 'kam',
  permissions: [],
  territories: ['North', 'Northeast'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

const customerUser: User = {
  id: '3',
  email: 'customer@test.com',
  name: 'Customer User',
  role: 'customer',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

// Test data with territories
interface TestLead {
  id: string;
  territory: Territory;
  customerName: string;
}

const testLeads: TestLead[] = [
  { id: '1', territory: 'North', customerName: 'Customer 1' },
  { id: '2', territory: 'South', customerName: 'Customer 2' },
  { id: '3', territory: 'Northeast', customerName: 'Customer 3' },
  { id: '4', territory: 'West', customerName: 'Customer 4' },
];

describe('Territory Utility Functions', () => {
  describe('getUserTerritoryAccess', () => {
    it('should return full access for admin users', () => {
      const access = getUserTerritoryAccess(adminUser);

      expect(access.hasFullAccess).toBe(true);
      expect(access.territories).toEqual(ALL_TERRITORIES);
      expect(access.canAccessTerritory('North')).toBe(true);
      expect(access.canAccessTerritory('South')).toBe(true);
    });

    it('should return limited access for KAM users', () => {
      const access = getUserTerritoryAccess(kamUserNorth);

      expect(access.hasFullAccess).toBe(false);
      expect(access.territories).toEqual(['North', 'Northeast']);
      expect(access.canAccessTerritory('North')).toBe(true);
      expect(access.canAccessTerritory('Northeast')).toBe(true);
      expect(access.canAccessTerritory('South')).toBe(false);
    });

    it('should return no access for null user', () => {
      const access = getUserTerritoryAccess(null);

      expect(access.hasFullAccess).toBe(false);
      expect(access.territories).toEqual([]);
      expect(access.canAccessTerritory('North')).toBe(false);
    });

    it('should handle users with empty territories', () => {
      const access = getUserTerritoryAccess(customerUser);

      expect(access.hasFullAccess).toBe(false);
      expect(access.territories).toEqual([]);
      expect(access.canAccessTerritory('North')).toBe(false);
    });
  });

  describe('hasTerritoryAccess', () => {
    it('should allow admin access to any territory', () => {
      expect(hasTerritoryAccess(adminUser, 'North')).toBe(true);
      expect(hasTerritoryAccess(adminUser, 'South')).toBe(true);
      expect(hasTerritoryAccess(adminUser, 'West')).toBe(true);
    });

    it('should allow KAM access to assigned territories only', () => {
      expect(hasTerritoryAccess(kamUserNorth, 'North')).toBe(true);
      expect(hasTerritoryAccess(kamUserNorth, 'Northeast')).toBe(true);
      expect(hasTerritoryAccess(kamUserNorth, 'South')).toBe(false);
      expect(hasTerritoryAccess(kamUserNorth, 'West')).toBe(false);
    });

    it('should deny access for null user', () => {
      expect(hasTerritoryAccess(null, 'North')).toBe(false);
    });
  });

  describe('hasAnyTerritoryAccess', () => {
    it('should return true for admin with any territories', () => {
      expect(hasAnyTerritoryAccess(adminUser, ['North', 'South'])).toBe(true);
      expect(hasAnyTerritoryAccess(adminUser, ['West'])).toBe(true);
    });

    it('should return true when KAM has access to at least one territory', () => {
      expect(hasAnyTerritoryAccess(kamUserNorth, ['North', 'South'])).toBe(
        true
      );
      expect(hasAnyTerritoryAccess(kamUserNorth, ['Northeast', 'West'])).toBe(
        true
      );
    });

    it('should return false when KAM has no access to any territory', () => {
      expect(hasAnyTerritoryAccess(kamUserNorth, ['South', 'West'])).toBe(
        false
      );
    });

    it('should return false for empty required territories', () => {
      expect(hasAnyTerritoryAccess(kamUserNorth, [])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasAnyTerritoryAccess(null, ['North'])).toBe(false);
    });
  });

  describe('getTerritoryQueryParams', () => {
    it('should return empty params for admin users', () => {
      const params = getTerritoryQueryParams(adminUser);
      expect(params).toEqual({});
    });

    it('should return territory params for KAM users', () => {
      const params = getTerritoryQueryParams(kamUserNorth);
      expect(params).toEqual({
        territories: ['North', 'Northeast'],
      });
    });

    it('should return empty params for users without territories', () => {
      const params = getTerritoryQueryParams(customerUser);
      expect(params).toEqual({});
    });

    it('should return empty params for null user', () => {
      const params = getTerritoryQueryParams(null);
      expect(params).toEqual({});
    });
  });

  describe('getTerritoryHeaders', () => {
    it('should return role header for admin users', () => {
      const headers = getTerritoryHeaders(adminUser);
      expect(headers).toEqual({
        'X-User-Role': 'admin',
      });
    });

    it('should return role and territory headers for KAM users', () => {
      const headers = getTerritoryHeaders(kamUserNorth);
      expect(headers).toEqual({
        'X-User-Role': 'kam',
        'X-User-Territories': 'North,Northeast',
      });
    });

    it('should return only role header for users without territories', () => {
      const headers = getTerritoryHeaders(customerUser);
      expect(headers).toEqual({
        'X-User-Role': 'customer',
      });
    });

    it('should return empty headers for null user', () => {
      const headers = getTerritoryHeaders(null);
      expect(headers).toEqual({});
    });
  });

  describe('filterByTerritory', () => {
    it('should return all data for admin users', () => {
      const filtered = filterByTerritory(testLeads, adminUser);
      expect(filtered).toEqual(testLeads);
      expect(filtered.length).toBe(4);
    });

    it('should filter data for KAM users (>80% reduction test)', () => {
      const filtered = filterByTerritory(testLeads, kamUserNorth);

      // KAM should only see North and Northeast leads
      expect(filtered.length).toBe(2);
      expect(filtered).toEqual([
        { id: '1', territory: 'North', customerName: 'Customer 1' },
        { id: '3', territory: 'Northeast', customerName: 'Customer 3' },
      ]);

      // Verify >80% reduction in data visibility compared to admin
      const reductionPercentage =
        ((testLeads.length - filtered.length) / testLeads.length) * 100;
      expect(reductionPercentage).toBeGreaterThan(80);
    });

    it('should return empty array for users without territories', () => {
      const filtered = filterByTerritory(testLeads, customerUser);
      expect(filtered).toEqual([]);
    });

    it('should return empty array for null user', () => {
      const filtered = filterByTerritory(testLeads, null);
      expect(filtered).toEqual([]);
    });

    it('should handle empty data array', () => {
      const filtered = filterByTerritory([], kamUserNorth);
      expect(filtered).toEqual([]);
    });
  });

  describe('validateRouteAccess', () => {
    it('should grant access for admin users with no restrictions', () => {
      const result = validateRouteAccess(adminUser);
      expect(result).toEqual({ hasAccess: true });
    });

    it('should grant access when role requirements are met', () => {
      const result = validateRouteAccess(adminUser, undefined, [
        'admin',
        'kam',
      ]);
      expect(result).toEqual({ hasAccess: true });
    });

    it('should deny access when role requirements are not met', () => {
      const result = validateRouteAccess(kamUserNorth, undefined, ['admin']);
      expect(result).toEqual({ hasAccess: false, reason: 'INVALID_ROLE' });
    });

    it('should grant access when territory requirements are met', () => {
      const result = validateRouteAccess(kamUserNorth, ['North', 'West']);
      expect(result).toEqual({ hasAccess: true });
    });

    it('should deny access when territory requirements are not met', () => {
      const result = validateRouteAccess(kamUserNorth, ['South', 'West']);
      expect(result).toEqual({ hasAccess: false, reason: 'INVALID_TERRITORY' });
    });

    it('should grant access when both role and territory requirements are met', () => {
      const result = validateRouteAccess(kamUserNorth, ['Northeast'], ['kam']);
      expect(result).toEqual({ hasAccess: true });
    });

    it('should deny access when role is valid but territory is not', () => {
      const result = validateRouteAccess(kamUserNorth, ['South'], ['kam']);
      expect(result).toEqual({ hasAccess: false, reason: 'INVALID_TERRITORY' });
    });

    it('should deny access for null user', () => {
      const result = validateRouteAccess(null);
      expect(result).toEqual({ hasAccess: false, reason: 'NO_USER' });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle user with undefined territories array', () => {
      const userWithUndefinedTerritories = {
        ...kamUserNorth,
        territories: undefined as any,
      };

      const access = getUserTerritoryAccess(userWithUndefinedTerritories);
      expect(access.territories).toEqual([]);
      expect(access.hasFullAccess).toBe(false);
    });

    it('should handle empty territory arrays in functions', () => {
      const userWithEmptyTerritories = {
        ...kamUserNorth,
        territories: [],
      };

      expect(hasTerritoryAccess(userWithEmptyTerritories, 'North')).toBe(false);
      expect(hasAnyTerritoryAccess(userWithEmptyTerritories, ['North'])).toBe(
        false
      );
      expect(getTerritoryQueryParams(userWithEmptyTerritories)).toEqual({});
    });

    it('should handle all available territories constant', () => {
      expect(ALL_TERRITORIES).toContain('North');
      expect(ALL_TERRITORIES).toContain('South');
      expect(ALL_TERRITORIES).toContain('East');
      expect(ALL_TERRITORIES).toContain('West');
      expect(ALL_TERRITORIES.length).toBeGreaterThan(4);
    });
  });
});
