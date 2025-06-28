/**
 * useLeadsTable hook unit tests
 * Tests table state management and data handling with >85% coverage
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { useLeadsTable } from '../useLeadsTable';
import { apiSlice } from '../../api/apiSlice';
import { authSlice } from '../../store/slices/authSlice';
import type { LeadListResponse, Lead } from '../../types/lead.types';

// Mock server
const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock the useLeadAccess hook
jest.mock('../useLeadAccess', () => ({
  useLeadAccess: jest.fn(() => ({
    filterAccessibleLeads: jest.fn(leads => leads), // Return leads as-is for testing
    canPerformAction: jest.fn(() => ({ hasAccess: true })),
    isAdmin: true,
    isKAM: false,
    userTerritories: ['West'],
  })),
}));

// Test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      api: apiSlice.reducer,
      auth: authSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: initialState,
  });
};

// Test wrapper
const createWrapper = (initialState = {}) => {
  const store = createTestStore(initialState);
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

// Mock data with correct Lead interface
const mockLeads: Lead[] = [
  {
    id: '1',
    leadId: 'LEAD-001',
    customerName: 'John Doe',
    customerPhone: '+919876543210',
    address: 'Test Address',
    state: 'Maharashtra',
    pinCode: '400001',
    status: 'New Lead',
    origin: 'CP',
    territory: 'West',
    assignedTo: 'cp-1',
    createdBy: 'user1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    leadId: 'LEAD-002',
    customerName: 'Jane Doe',
    customerPhone: '+919876543211',
    address: 'Test Address 2',
    state: 'Maharashtra',
    pinCode: '400002',
    status: 'In Discussion',
    origin: 'Customer',
    territory: 'West',
    assignedTo: 'cp-2',
    createdBy: 'user2',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
];

const mockLeadListResponse: LeadListResponse = {
  success: true,
  data: {
    items: mockLeads,
    total: 2,
    offset: 0,
    limit: 25,
    totalPages: 1,
  },
};

describe('useLeadsTable', () => {
  beforeEach(() => {
    server.use(
      rest.get('*/api/v1/leads', (req, res, ctx) => {
        return res(ctx.json(mockLeadListResponse));
      })
    );
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    expect(result.current.filters).toEqual({
      offset: 0,
      limit: 25,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.current.sortBy).toBe('createdAt');
    expect(result.current.sortOrder).toBe('desc');
    expect(result.current.page).toBe(0);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.selectedLeads).toEqual([]);
  });

  it('should load leads successfully', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.leads).toHaveLength(2);
    expect(result.current.total).toBe(2);
  });

  it('should handle filter changes', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        status: 'New Lead',
      });
    });

    expect(result.current.filters.status).toBe('New Lead');
    expect(result.current.page).toBe(0); // Should reset to page 0
  });

  it('should handle sort changes', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    act(() => {
      result.current.setSorting('customerName', 'asc');
    });

    expect(result.current.sortBy).toBe('customerName');
    expect(result.current.sortOrder).toBe('asc');
  });

  it('should handle pagination changes', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    act(() => {
      result.current.setPage(1);
    });

    expect(result.current.page).toBe(1);

    act(() => {
      result.current.setPageSize(50);
    });

    expect(result.current.pageSize).toBe(50);
    expect(result.current.page).toBe(0); // Should reset to page 0
  });

  it('should handle lead selection', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    await waitFor(() => {
      expect(result.current.leads).toHaveLength(2);
    });

    act(() => {
      result.current.selectLead('1', true);
    });

    expect(result.current.selectedLeads).toContain('1');

    act(() => {
      result.current.selectLead('1', false);
    });

    expect(result.current.selectedLeads).not.toContain('1');
  });

  it('should handle select all leads', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    await waitFor(() => {
      expect(result.current.leads).toHaveLength(2);
    });

    act(() => {
      result.current.selectAll(true);
    });

    expect(result.current.selectedLeads).toHaveLength(2);

    act(() => {
      result.current.selectAll(false);
    });

    expect(result.current.selectedLeads).toHaveLength(0);
  });

  it('should handle large selection sets efficiently', async () => {
    // Create a large array of leads
    const manyLeads: Lead[] = Array.from({ length: 100 }, (_, index) => ({
      id: `${index + 1}`,
      leadId: `LEAD-${String(index + 1).padStart(3, '0')}`,
      customerName: `Customer ${index + 1}`,
      customerPhone: `+9198765432${String(index).padStart(2, '0')}`,
      address: `Address ${index + 1}`,
      state: 'Maharashtra',
      pinCode: '400001',
      status: 'New Lead' as const,
      origin: 'CP' as const,
      territory: 'West',
      assignedTo: 'cp-1',
      createdBy: 'user1',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    }));

    server.use(
      rest.get('*/api/v1/leads', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              items: manyLeads,
              total: 100,
              offset: 0,
              limit: 100,
              totalPages: 1,
            },
          })
        );
      })
    );

    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    await waitFor(() => {
      expect(result.current.leads).toHaveLength(100);
    });

    act(() => {
      result.current.selectAll(true);
    });

    expect(result.current.selectedLeads).toHaveLength(100);
  });

  it('should handle error states', async () => {
    server.use(
      rest.get('*/api/v1/leads', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            success: false,
            error: { message: 'Server error' },
          })
        );
      })
    );

    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.leads).toEqual([]);
  });

  it('should handle empty results', async () => {
    server.use(
      rest.get('*/api/v1/leads', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              items: [],
              total: 0,
              offset: 0,
              limit: 25,
              totalPages: 0,
            },
          })
        );
      })
    );

    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    await waitFor(() => {
      expect(result.current.isEmpty).toBe(true);
    });

    expect(result.current.leads).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('should clear selection when filters change', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    await waitFor(() => {
      expect(result.current.leads).toHaveLength(2);
    });

    act(() => {
      result.current.selectLead('1', true);
    });

    expect(result.current.selectedLeads).toContain('1');

    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        status: 'In Discussion',
      });
    });

    expect(result.current.selectedLeads).toEqual([]);
  });

  it('should handle refresh action', async () => {
    let requestCount = 0;
    server.use(
      rest.get('*/api/v1/leads', (req, res, ctx) => {
        requestCount++;
        return res(ctx.json(mockLeadListResponse));
      })
    );

    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    // Initial load
    await waitFor(() => {
      expect(requestCount).toBe(1);
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(requestCount).toBe(2);
    });
  });

  it('should handle clear filters', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    // Set some filters
    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        status: 'New Lead',
        search: 'John',
      });
    });

    expect(result.current.filters.status).toBe('New Lead');
    expect(result.current.filters.search).toBe('John');

    // Clear filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({
      offset: 0,
      limit: 25,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.current.page).toBe(0);
  });

  it('should calculate derived state correctly', async () => {
    const { result } = renderHook(() => useLeadsTable(), {
      wrapper: createWrapper({
        auth: {
          user: { id: 'admin-1', role: 'admin' },
          isAuthenticated: true,
          token: 'test-token',
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
      }),
    });

    await waitFor(() => {
      expect(result.current.leads).toHaveLength(2);
    });

    expect(result.current.totalPages).toBe(1);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPreviousPage).toBe(false);
    expect(result.current.hasFilters).toBe(false);
    expect(result.current.isEmpty).toBe(false);

    // Set filters to test hasFilters
    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        search: 'test',
      });
    });

    expect(result.current.hasFilters).toBe(true);
  });

  it('should handle polling configuration', async () => {
    const { result } = renderHook(
      () =>
        useLeadsTable({
          enablePolling: true,
          pollingInterval: 1000,
        }),
      {
        wrapper: createWrapper({
          auth: {
            user: { id: 'admin-1', role: 'admin' },
            isAuthenticated: true,
            token: 'test-token',
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
        }),
      }
    );

    await waitFor(() => {
      expect(result.current.leads).toHaveLength(2);
    });

    // Polling configuration should not affect basic functionality
    expect(result.current.leads).toEqual(mockLeads);
  });
});
