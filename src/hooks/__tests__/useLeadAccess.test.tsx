/**
 * useLeadAccess hooks integration tests
 * Tests the custom hooks with real Redux store integration
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../../store/slices/authSlice';
import { useLeadAccess } from '../useLeadAccess';
import type { User } from '../../types/user.types';
import type { Lead } from '../../types/lead.types';

// Mock users
const adminUser: User = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const kamUser: User = {
  id: 'kam-1',
  email: 'kam@test.com',
  name: 'KAM User',
  role: 'kam',
  permissions: [],
  territories: ['North', 'South'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const cpUser: User = {
  id: 'cp-1',
  email: 'cp@test.com',
  name: 'CP User',
  role: 'cp',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

// Mock leads
const northLead: Lead = {
  id: 'lead-1',
  leadId: 'LEAD-001',
  customerName: 'John Doe',
  customerPhone: '1234567890',
  address: 'Test Address',
  state: 'Test State',
  pinCode: '123456',
  territory: 'North',
  status: 'New Lead',
  origin: 'CP',
  assignedTo: 'cp-1',
  assignedCpName: 'CP User',
  createdBy: 'cp-1',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const eastLead: Lead = {
  id: 'lead-2',
  leadId: 'LEAD-002',
  customerName: 'Jane Doe',
  customerPhone: '9876543210',
  address: 'Test Address 2',
  state: 'Test State 2',
  pinCode: '654321',
  territory: 'East',
  status: 'New Lead',
  origin: 'CP',
  assignedTo: 'cp-2',
  assignedCpName: 'CP User 2',
  createdBy: 'cp-2',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

// Test wrapper
const createWrapper = (user: User | null) => {
  const store = configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        user,
        isAuthenticated: !!user,
        token: user ? 'test-token' : null,
        refreshToken: null,
        expiresAt: null,
        isLoading: false,
        lastActivity: null,
        loginTimestamp: null,
        sessionWarningShown: false,
        error: null,
        loginAttempts: 0,
        lockoutUntil: null,
        rememberMe: false,
        twoFactorRequired: false,
        twoFactorToken: null,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useLeadAccess hooks', () => {
  describe('useLeadAccess basic functionality', () => {
    it('should return admin capabilities', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(adminUser),
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isKAM).toBe(false);
      expect(result.current.isCP).toBe(false);
      expect(result.current.userTerritories).toEqual([]);
    });

    it('should return KAM capabilities', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(kamUser),
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isKAM).toBe(true);
      expect(result.current.isCP).toBe(false);
      expect(result.current.userTerritories).toEqual(['North', 'South']);
    });

    it('should return CP capabilities', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(cpUser),
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isKAM).toBe(false);
      expect(result.current.isCP).toBe(true);
      expect(result.current.userTerritories).toEqual([]);
    });

    it('should return no capabilities for unauthenticated user', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isKAM).toBe(false);
      expect(result.current.isCP).toBe(false);
      expect(result.current.userTerritories).toEqual([]);
    });
  });

  describe('canPerformAction functionality', () => {
    it('should allow admin all actions', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(adminUser),
      });

      expect(result.current.canPerformAction('read', northLead).hasAccess).toBe(
        true
      );
      expect(
        result.current.canPerformAction('write', northLead).hasAccess
      ).toBe(true);
      expect(
        result.current.canPerformAction('delete', northLead).hasAccess
      ).toBe(true);
      expect(
        result.current.canPerformAction('reassign', northLead).hasAccess
      ).toBe(true);
    });

    it('should allow KAM appropriate actions for accessible leads', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(kamUser),
      });

      expect(result.current.canPerformAction('read', northLead).hasAccess).toBe(
        true
      );
      expect(
        result.current.canPerformAction('write', northLead).hasAccess
      ).toBe(true);
      expect(
        result.current.canPerformAction('delete', northLead).hasAccess
      ).toBe(false);
      expect(
        result.current.canPerformAction('reassign', northLead).hasAccess
      ).toBe(true);
    });

    it('should deny KAM access to leads outside territory', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(kamUser),
      });

      expect(result.current.canPerformAction('read', eastLead).hasAccess).toBe(
        false
      );
      expect(result.current.canPerformAction('write', eastLead).hasAccess).toBe(
        false
      );
      expect(
        result.current.canPerformAction('delete', eastLead).hasAccess
      ).toBe(false);
      expect(
        result.current.canPerformAction('reassign', eastLead).hasAccess
      ).toBe(false);
    });

    it('should allow CP to manage assigned leads', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(cpUser),
      });

      expect(result.current.canPerformAction('read', northLead).hasAccess).toBe(
        true
      );
      expect(
        result.current.canPerformAction('write', northLead).hasAccess
      ).toBe(true);
      expect(
        result.current.canPerformAction('delete', northLead).hasAccess
      ).toBe(false);
      expect(
        result.current.canPerformAction('reassign', northLead).hasAccess
      ).toBe(false);
    });

    it('should deny CP access to non-assigned leads', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(cpUser),
      });

      expect(result.current.canPerformAction('read', eastLead).hasAccess).toBe(
        false
      );
      expect(result.current.canPerformAction('write', eastLead).hasAccess).toBe(
        false
      );
      expect(
        result.current.canPerformAction('delete', eastLead).hasAccess
      ).toBe(false);
      expect(
        result.current.canPerformAction('reassign', eastLead).hasAccess
      ).toBe(false);
    });
  });

  describe('filterAccessibleLeads functionality', () => {
    const allLeads = [northLead, eastLead];

    it('should return all leads for admin', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(adminUser),
      });

      const filtered = result.current.filterAccessibleLeads(allLeads);
      expect(filtered).toHaveLength(2);
      expect(filtered).toEqual(allLeads);
    });

    it('should filter leads by territory for KAM', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(kamUser),
      });

      const filtered = result.current.filterAccessibleLeads(allLeads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.territory).toBe('North');
    });

    it('should filter leads by assignment for CP', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(cpUser),
      });

      const filtered = result.current.filterAccessibleLeads(allLeads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.assignedTo).toBe('cp-1');
    });

    it('should return empty array for unauthenticated user', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(null),
      });

      const filtered = result.current.filterAccessibleLeads(allLeads);
      expect(filtered).toEqual([]);
    });

    it('should handle empty lead array', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(adminUser),
      });

      const filtered = result.current.filterAccessibleLeads([]);
      expect(filtered).toEqual([]);
    });
  });

  describe('hook reactivity and memoization', () => {
    it('should re-evaluate when user changes', () => {
      let currentUser = kamUser;
      const { result, rerender } = renderHook(() => useLeadAccess(), {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          createWrapper(currentUser)({ children }),
      });

      expect(result.current.isKAM).toBe(true);

      // Change to different user
      currentUser = adminUser;
      rerender();
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isKAM).toBe(false);
    });

    it('should memoize results when inputs do not change', () => {
      const { result, rerender } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(kamUser),
      });

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // Functions should be stable across re-renders
      expect(firstResult.canPerformAction).toBe(secondResult.canPerformAction);
      expect(firstResult.filterAccessibleLeads).toBe(
        secondResult.filterAccessibleLeads
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle leads without territory', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(kamUser),
      });

      const leadWithoutTerritory = {
        ...northLead,
        territory: undefined as any,
      };
      expect(
        result.current.canPerformAction('read', leadWithoutTerritory).hasAccess
      ).toBe(true);
    });

    it('should handle null lead', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(adminUser),
      });

      expect(result.current.canPerformAction('read', null).hasAccess).toBe(
        false
      );
      expect(result.current.canPerformAction('read', null).reason).toBe(
        'LEAD_NOT_FOUND'
      );
    });

    it('should handle unknown action types', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(adminUser),
      });

      expect(
        result.current.canPerformAction('unknown' as any, northLead).hasAccess
      ).toBe(false);
      expect(
        result.current.canPerformAction('unknown' as any, northLead).reason
      ).toBe('INVALID_ROLE');
    });
  });

  describe('performance with large datasets', () => {
    it('should handle large arrays efficiently', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(kamUser),
      });

      const largeLeadArray = Array.from({ length: 1000 }, (_, index) => ({
        ...northLead,
        id: `lead-${index}`,
        leadId: `LEAD-${String(index).padStart(3, '0')}`,
        territory: (index % 2 === 0 ? 'North' : 'East') as any,
      }));

      const startTime = performance.now();
      const filtered = result.current.filterAccessibleLeads(largeLeadArray);
      const endTime = performance.now();

      expect(filtered.length).toBe(500); // Half should be North territory
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });
  });

  describe('integration scenarios', () => {
    it('should work correctly with real-world lead structures', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(kamUser),
      });

      const complexLead = {
        ...northLead,
        followUpDate: '2024-02-01',
        remarks: 'Customer interested',
        quotationRef: 'QUOTE-001',
        tokenNumber: 'TOKEN-001',
        customerEmail: 'test@example.com',
      };

      expect(
        result.current.canPerformAction('read', complexLead).hasAccess
      ).toBe(true);
      expect(
        result.current.canPerformAction('write', complexLead).hasAccess
      ).toBe(true);
    });

    it('should handle territory case sensitivity', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(kamUser),
      });

      const leadWithLowerCase = { ...northLead, territory: 'north' as any };
      expect(
        result.current.canPerformAction('read', leadWithLowerCase).hasAccess
      ).toBe(false);
    });

    it('should validate action permissions comprehensively', () => {
      const { result } = renderHook(() => useLeadAccess(), {
        wrapper: createWrapper(cpUser),
      });

      const actions = ['read', 'write', 'delete', 'reassign'] as const;
      const results = actions.map(action => ({
        action,
        result: result.current.canPerformAction(action, northLead),
      }));

      expect(results.find(r => r.action === 'read')?.result.hasAccess).toBe(
        true
      );
      expect(results.find(r => r.action === 'write')?.result.hasAccess).toBe(
        true
      );
      expect(results.find(r => r.action === 'delete')?.result.hasAccess).toBe(
        false
      );
      expect(results.find(r => r.action === 'reassign')?.result.hasAccess).toBe(
        false
      );
    });
  });
});
