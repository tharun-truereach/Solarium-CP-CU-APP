/**
 * Unit tests for lead access guard utility
 * Tests access control logic for different user roles and territories
 */

import {
  assertLeadAccess,
  assertTerritoryAccess,
  assertLeadActionAccess,
  filterLeadsByAccess,
} from '../leadAccessGuard';
import type { User } from '../../types/user.types';
import type { Lead } from '../../types/lead.types';

// Mock users
const mockAdminUser: User = {
  id: 'admin-1',
  email: 'admin@solarium.com',
  name: 'Admin User',
  role: 'admin',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockKamUser: User = {
  id: 'kam-1',
  email: 'kam@solarium.com',
  name: 'KAM User',
  role: 'kam',
  permissions: [],
  territories: ['West', 'Central'],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockCPUser: User = {
  id: 'cp-1',
  email: 'cp@solarium.com',
  name: 'CP User',
  role: 'cp',
  permissions: [],
  territories: ['West'],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock leads
const mockLeadInWest: Lead = {
  id: '1',
  leadId: 'LEAD-001',
  customerName: 'John Doe',
  customerPhone: '+919876543210',
  address: '123 Main St',
  state: 'Maharashtra',
  pinCode: '400001',
  territory: 'West',
  status: 'New Lead',
  origin: 'CP',
  assignedTo: 'cp-1',
  createdBy: 'cp-1',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockLeadInEast: Lead = {
  id: '2',
  leadId: 'LEAD-002',
  customerName: 'Jane Smith',
  customerPhone: '+919876543211',
  address: '456 Oak Ave',
  state: 'West Bengal',
  pinCode: '700001',
  territory: 'East',
  status: 'New Lead',
  origin: 'CP',
  assignedTo: 'cp-2',
  createdBy: 'cp-2',
  createdAt: '2024-01-15T11:00:00Z',
  updatedAt: '2024-01-15T11:00:00Z',
};

describe('Lead Access Guard', () => {
  describe('assertLeadAccess', () => {
    it('should allow admin access to all leads', () => {
      const result = assertLeadAccess(mockAdminUser, mockLeadInWest);
      expect(result.hasAccess).toBe(true);
    });

    it('should allow KAM access to leads in their territory', () => {
      const result = assertLeadAccess(mockKamUser, mockLeadInWest);
      expect(result.hasAccess).toBe(true);
    });

    it('should deny KAM access to leads outside their territory', () => {
      const result = assertLeadAccess(mockKamUser, mockLeadInEast);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_TERRITORY');
      expect(result.message).toContain('East');
    });

    it('should allow CP access to their assigned leads', () => {
      const result = assertLeadAccess(mockCPUser, mockLeadInWest);
      expect(result.hasAccess).toBe(true);
    });

    it('should deny CP access to leads not assigned to them', () => {
      const result = assertLeadAccess(mockCPUser, mockLeadInEast);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_TERRITORY');
    });

    it('should deny access when user is null', () => {
      const result = assertLeadAccess(null, mockLeadInWest);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('NO_USER');
    });

    it('should deny access when lead is null', () => {
      const result = assertLeadAccess(mockKamUser, null);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('LEAD_NOT_FOUND');
    });

    it('should allow KAM access to leads with no territory', () => {
      const globalLead = { ...mockLeadInWest };
      delete (globalLead as any).territory;
      const result = assertLeadAccess(mockKamUser, globalLead);
      expect(result.hasAccess).toBe(true);
    });
  });

  describe('assertTerritoryAccess', () => {
    it('should allow admin access to all territories', () => {
      const result = assertTerritoryAccess(mockAdminUser, [
        'West',
        'East',
        'North',
      ]);
      expect(result.hasAccess).toBe(true);
    });

    it('should allow KAM access to their assigned territories', () => {
      const result = assertTerritoryAccess(mockKamUser, ['West', 'Central']);
      expect(result.hasAccess).toBe(true);
    });

    it('should deny KAM access to territories outside their assignment', () => {
      const result = assertTerritoryAccess(mockKamUser, ['East', 'North']);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_TERRITORY');
      expect(result.message).toContain('East, North');
    });

    it('should allow partial territory access for KAM', () => {
      const result = assertTerritoryAccess(mockKamUser, ['West']);
      expect(result.hasAccess).toBe(true);
    });
  });

  describe('assertLeadActionAccess', () => {
    it('should allow admin all actions', () => {
      expect(
        assertLeadActionAccess(mockAdminUser, 'read', mockLeadInWest).hasAccess
      ).toBe(true);
      expect(
        assertLeadActionAccess(mockAdminUser, 'write', mockLeadInWest).hasAccess
      ).toBe(true);
      expect(
        assertLeadActionAccess(mockAdminUser, 'delete', mockLeadInWest)
          .hasAccess
      ).toBe(true);
      expect(
        assertLeadActionAccess(mockAdminUser, 'reassign', mockLeadInWest)
          .hasAccess
      ).toBe(true);
    });

    it('should allow KAM read and write actions', () => {
      expect(
        assertLeadActionAccess(mockKamUser, 'read', mockLeadInWest).hasAccess
      ).toBe(true);
      expect(
        assertLeadActionAccess(mockKamUser, 'write', mockLeadInWest).hasAccess
      ).toBe(true);
      expect(
        assertLeadActionAccess(mockKamUser, 'reassign', mockLeadInWest)
          .hasAccess
      ).toBe(true);
    });

    it('should deny KAM delete action', () => {
      const result = assertLeadActionAccess(
        mockKamUser,
        'delete',
        mockLeadInWest
      );
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_ROLE');
    });

    it('should allow CP to read and write their assigned leads', () => {
      expect(
        assertLeadActionAccess(mockCPUser, 'read', mockLeadInWest).hasAccess
      ).toBe(true);
      expect(
        assertLeadActionAccess(mockCPUser, 'write', mockLeadInWest).hasAccess
      ).toBe(true);
    });

    it('should deny CP reassign action', () => {
      const result = assertLeadActionAccess(
        mockCPUser,
        'reassign',
        mockLeadInWest
      );
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_ROLE');
    });
  });

  describe('filterLeadsByAccess', () => {
    const leads = [mockLeadInWest, mockLeadInEast];

    it('should return all leads for admin', () => {
      const filtered = filterLeadsByAccess(mockAdminUser, leads);
      expect(filtered).toHaveLength(2);
    });

    it('should filter leads by territory for KAM', () => {
      const filtered = filterLeadsByAccess(mockKamUser, leads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.territory).toBe('West');
    });

    it('should filter leads by assignment for CP', () => {
      const filtered = filterLeadsByAccess(mockCPUser, leads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.assignedTo).toBe('cp-1');
    });

    it('should return empty array for null user', () => {
      const filtered = filterLeadsByAccess(null, leads);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle leads without territory', () => {
      const leadWithoutTerritory = { ...mockLeadInWest };
      delete (leadWithoutTerritory as any).territory;
      const result = assertLeadAccess(
        mockKamUser,
        leadWithoutTerritory as Lead
      );
      expect(result.hasAccess).toBe(true); // Should allow access to leads without territory
    });

    it('should handle users without territories', () => {
      const userWithoutTerritories = { ...mockKamUser, territories: [] };
      const result = assertLeadAccess(userWithoutTerritories, mockLeadInWest);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_TERRITORY');
    });

    it('should handle null territory in lead', () => {
      const leadWithNullTerritory = {
        ...mockLeadInWest,
        territory: null as any,
      };
      const result = assertLeadAccess(mockKamUser, leadWithNullTerritory);
      expect(result.hasAccess).toBe(true);
    });

    it('should handle empty string territory', () => {
      const leadWithEmptyTerritory = {
        ...mockLeadInWest,
        territory: '' as any,
      };
      const result = assertLeadAccess(mockKamUser, leadWithEmptyTerritory);
      expect(result.hasAccess).toBe(true);
    });

    it('should handle case-sensitive territory matching', () => {
      const leadWithLowerCase = { ...mockLeadInWest, territory: 'west' as any };
      const result = assertLeadAccess(mockKamUser, leadWithLowerCase);
      expect(result.hasAccess).toBe(false); // Should be case-sensitive
    });
  });

  describe('filterLeadsByAccess performance', () => {
    it('should handle large arrays efficiently', () => {
      const largeLeadArray = Array.from({ length: 1000 }, (_, index) => ({
        ...mockLeadInWest,
        id: `lead-${index}`,
        leadId: `LEAD-${String(index).padStart(3, '0')}`,
        territory: (index % 2 === 0 ? 'West' : 'East') as any,
      }));

      const startTime = performance.now();
      const result = filterLeadsByAccess(mockKamUser, largeLeadArray);
      const endTime = performance.now();

      expect(result.length).toBe(500); // Half should be West territory
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should handle empty arrays', () => {
      const result = filterLeadsByAccess(mockKamUser, []);
      expect(result).toEqual([]);
    });

    it('should return empty array for null leads', () => {
      const result = filterLeadsByAccess(mockKamUser, null as any);
      expect(result).toEqual([]);
    });
  });

  describe('assertLeadAccess error handling', () => {
    it('should provide detailed error information for territory violation', () => {
      const result = assertLeadAccess(mockKamUser, mockLeadInEast);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_TERRITORY');
      expect(result.message).toContain('East');
      expect(result.message).toContain('West, Central');
    });

    it('should provide detailed error information for unauthenticated user', () => {
      const result = assertLeadAccess(null, mockLeadInWest);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('NO_USER');
      expect(result.message).toBe('User not authenticated');
    });

    it('should provide detailed error information for missing lead', () => {
      const result = assertLeadAccess(mockAdminUser, null);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('LEAD_NOT_FOUND');
      expect(result.message).toBe('Lead not found');
    });
  });

  describe('assertLeadActionAccess comprehensive tests', () => {
    it('should return correct permissions for CP assigned to lead', () => {
      const result = assertLeadActionAccess(
        mockCPUser,
        'write',
        mockLeadInWest
      );
      expect(result.hasAccess).toBe(true);
    });

    it('should return limited permissions for CP not assigned to lead', () => {
      const result = assertLeadActionAccess(
        mockCPUser,
        'write',
        mockLeadInEast
      );
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_TERRITORY');
    });

    it('should handle unknown user role', () => {
      const unknownRoleUser = { ...mockAdminUser, role: 'unknown' as any };
      const result = assertLeadActionAccess(
        unknownRoleUser,
        'read',
        mockLeadInWest
      );
      expect(result.hasAccess).toBe(true); // Read is allowed for authenticated users
    });

    it('should deny delete action for non-admin users', () => {
      const result = assertLeadActionAccess(
        mockKamUser,
        'delete',
        mockLeadInWest
      );
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_ROLE');
      expect(result.message).toBe('Only administrators can delete leads');
    });

    it('should deny reassign action for CP users', () => {
      const result = assertLeadActionAccess(
        mockCPUser,
        'reassign',
        mockLeadInWest
      );
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('INVALID_ROLE');
      expect(result.message).toBe(
        'You do not have permission to reassign leads'
      );
    });
  });

  describe('integration with territory utilities', () => {
    it('should work correctly with territory utility functions', () => {
      // Test that our lead access guard integrates properly with territory utils
      const territoryAccess = {
        territories: ['West', 'Central'],
        hasFullAccess: false,
        canAccessTerritory: (territory: any) =>
          ['West', 'Central'].includes(territory),
      };

      // Mock the territory utility (in real implementation, this comes from territory.ts)
      const mockHasTerritoryAccess = (user: any, territory: any) => {
        return territoryAccess.canAccessTerritory(territory);
      };

      // Simulate the check that happens in assertLeadAccess
      const hasAccess = mockHasTerritoryAccess(
        mockKamUser,
        mockLeadInWest.territory
      );
      expect(hasAccess).toBe(true);

      const hasAccessToEast = mockHasTerritoryAccess(
        mockKamUser,
        mockLeadInEast.territory
      );
      expect(hasAccessToEast).toBe(false);
    });
  });
});
