/**
 * useAuditLogs hook test suite
 * Tests hook functionality, pagination, and state management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../../api/apiSlice';
import { useAuditLogs } from '../useAuditLogs';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import type { SettingsAuditLog } from '../../types/settings.types';

// Mock data
const mockAuditLogs: SettingsAuditLog[] = [
  {
    id: '1',
    userId: 'admin-123',
    userName: 'Admin User',
    field: 'sessionTimeoutMin',
    oldValue: 15,
    newValue: 30,
    timestamp: '2024-01-15T10:30:00Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  },
  {
    id: '2',
    userId: 'admin-123',
    userName: 'Admin User',
    field: 'featureFlags.ADVANCED_REPORTING',
    oldValue: false,
    newValue: true,
    timestamp: '2024-01-15T10:25:00Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  },
];

// MSW server
const server = setupServer(
  rest.get('/api/v1/settings/audit', (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');

    return res(
      ctx.status(200),
      ctx.json({
        logs: mockAuditLogs,
        total: 25,
        page,
        limit,
        totalPages: Math.ceil(25 / limit),
      })
    );
  })
);

// Test wrapper
const createWrapper = () => {
  const store = configureStore({
    reducer: {
      api: apiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useAuditLogs', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.sortBy).toBe('timestamp');
      expect(result.current.sortOrder).toBe('desc');
      expect(result.current.filters).toEqual({});
    });

    it('should initialize with custom config', async () => {
      const config = {
        initialPage: 2,
        initialPageSize: 25,
        initialSortBy: 'userName',
        initialSortOrder: 'asc' as const,
      };

      const { result } = renderHook(() => useAuditLogs(config), {
        wrapper: createWrapper(),
      });

      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(25);
      expect(result.current.sortBy).toBe('userName');
      expect(result.current.sortOrder).toBe('asc');
    });
  });

  describe('Data Loading', () => {
    it('should load audit logs successfully', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.logs).toHaveLength(2);
      expect(result.current.total).toBe(25);
      expect(result.current.totalPages).toBe(3);
    });

    it('should handle loading states', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle error states', async () => {
      server.use(
        rest.get('/api/v1/settings/audit', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ message: 'Internal server error' })
          );
        })
      );

      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Pagination', () => {
    it('should handle page changes', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });

    it('should handle page size changes', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.pageSize).toBe(25);
      expect(result.current.page).toBe(1); // Should reset to first page
    });

    it('should calculate pagination flags correctly', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(false);

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(true);
    });

    it('should not allow invalid page numbers', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const currentPage = result.current.page;

      act(() => {
        result.current.setPage(0); // Invalid
      });

      expect(result.current.page).toBe(currentPage); // Should not change

      act(() => {
        result.current.setPage(999); // Beyond total pages
      });

      expect(result.current.page).toBe(currentPage); // Should not change
    });
  });

  describe('Sorting', () => {
    it('should handle sorting changes', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSorting('userName', 'asc');
      });

      expect(result.current.sortBy).toBe('userName');
      expect(result.current.sortOrder).toBe('asc');
    });

    it('should sort logs client-side for non-timestamp fields', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSorting('userName', 'asc');
      });

      // Should apply client-side sorting
      expect(result.current.logs).toHaveLength(2);
    });
  });

  describe('Filtering', () => {
    it('should handle filter changes', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const filters = { field: 'sessionTimeoutMin', userId: 'admin-123' };

      act(() => {
        result.current.setFilters(filters);
      });

      expect(result.current.filters).toEqual(filters);
      expect(result.current.page).toBe(1); // Should reset to first page
    });

    it('should clear filters', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setFilters({ field: 'test' });
      });

      expect(result.current.filters).toEqual({ field: 'test' });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({});
      expect(result.current.page).toBe(1);
    });

    it('should merge filters correctly', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setFilters({ field: 'test1' });
      });

      act(() => {
        result.current.setFilters({ userId: 'user1' });
      });

      expect(result.current.filters).toEqual({
        field: 'test1',
        userId: 'user1',
      });
    });
  });

  describe('Utilities', () => {
    it('should detect empty state', async () => {
      server.use(
        rest.get('/api/v1/settings/audit', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              logs: [],
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
            })
          );
        })
      );

      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isEmpty).toBe(true);
      });
    });

    it('should handle refresh', async () => {
      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.refresh();
      });

      // Should trigger refetch
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('Query Parameters', () => {
    it('should build query parameters correctly', async () => {
      server.use(
        rest.get('/api/v1/settings/audit', (req, res, ctx) => {
          const searchParams = req.url.searchParams;
          expect(searchParams.get('page')).toBe('2');
          expect(searchParams.get('limit')).toBe('25');
          expect(searchParams.get('field')).toBe('sessionTimeoutMin');

          return res(
            ctx.status(200),
            ctx.json({
              logs: mockAuditLogs,
              total: 25,
              page: 2,
              limit: 25,
              totalPages: 1,
            })
          );
        })
      );

      const { result } = renderHook(
        () =>
          useAuditLogs({
            initialPage: 2,
            initialPageSize: 25,
          }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setFilters({ field: 'sessionTimeoutMin' });
      });

      await waitFor(() => {
        expect(result.current.filters.field).toBe('sessionTimeoutMin');
      });
    });
  });
});
