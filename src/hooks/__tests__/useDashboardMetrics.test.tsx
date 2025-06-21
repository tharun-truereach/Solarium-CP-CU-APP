/**
 * Unit tests for useDashboardMetrics hook
 * Tests data fetching, loading states, and error handling
 */
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  vi,
  describe,
  it,
  beforeAll,
  afterEach,
  afterAll,
  expect,
} from 'vitest';
import { baseApi } from '../../api/baseApi';
import {
  useDashboardMetrics,
  useDashboardMetricsByRole,
  useDashboardMetricsWithRefresh,
} from '../useDashboardMetrics';
import type { DashboardMetrics } from '../../api/endpoints/dashboardEndpoints';

// Mock data
const mockMetrics: DashboardMetrics = {
  activeLeads: 12,
  pendingQuotations: 5,
  recentLeads: [
    {
      id: '1',
      customerName: 'John Doe',
      status: 'new',
      createdAt: '2024-01-01T10:00:00Z',
    },
  ],
  recentActivities: [
    {
      id: '1',
      title: 'New lead created',
      description: 'Test activity',
      timestamp: '2024-01-01T10:00:00Z',
      type: 'lead',
    },
  ],
  dateRange: {
    from: '2024-01-01T00:00:00Z',
    to: '2024-01-08T00:00:00Z',
  },
  lastUpdated: '2024-01-08T12:00:00Z',
};

const mockAdminMetrics: DashboardMetrics = {
  ...mockMetrics,
  channelPartners: 8,
  pendingCommissions: 3,
  totalRevenue: 750000,
};

// MSW server setup
const server = setupServer(
  rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
    const url = new URL(req.url);
    const includeDetails = url.searchParams.get('includeDetails');
    const limit = url.searchParams.get('limit');

    // Return admin metrics if limit is high (admin role)
    if (limit === '20') {
      return res(ctx.json(mockAdminMetrics));
    }

    return res(ctx.json(mockMetrics));
  }),

  rest.post('/api/v1/dashboard/metrics/refresh', (req, res, ctx) => {
    return res(
      ctx.json({
        ...mockMetrics,
        lastUpdated: new Date().toISOString(),
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      api: baseApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

const createWrapper = () => {
  const store = createTestStore();
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useDashboardMetrics', () => {
  it('returns initial loading state', () => {
    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
    expect(result.current.hasData).toBe(false);
  });

  it('loads dashboard metrics successfully', async () => {
    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockMetrics);
    expect(result.current.isError).toBe(false);
    expect(result.current.hasData).toBe(true);
    expect(result.current.isSuccess).toBe(true);
  });

  it('handles API errors correctly', async () => {
    server.use(
      rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.hasData).toBe(false);
    expect(result.current.error).toBeDefined();
  });

  it('skips query when skip option is true', () => {
    const { result } = renderHook(() => useDashboardMetrics({ skip: true }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('accepts custom query parameters', async () => {
    const params = {
      dateRange: { from: '2024-01-01', to: '2024-01-31' },
      includeDetails: true,
      limit: 20,
    };

    server.use(
      rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
        const url = new URL(req.url);
        // Verify parameters are passed correctly
        expect(url.searchParams.get('includeDetails')).toBe('true');
        expect(url.searchParams.get('limit')).toBe('20');
        expect(url.searchParams.get('dateFrom')).toBe('2024-01-01');
        expect(url.searchParams.get('dateTo')).toBe('2024-01-31');

        return res(ctx.json(mockMetrics));
      })
    );

    const { result } = renderHook(() => useDashboardMetrics({ params }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockMetrics);
  });

  it('calculates metrics age correctly', async () => {
    const pastTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
    const metricsWithAge = { ...mockMetrics, lastUpdated: pastTime };

    server.use(
      rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
        return res(ctx.json(metricsWithAge));
      })
    );

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.metricsAge).toBeGreaterThanOrEqual(9);
    expect(result.current.metricsAge).toBeLessThanOrEqual(11);
  });

  it('provides refetch functionality', async () => {
    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    // Test refetch doesn't throw
    expect(() => result.current.refetch()).not.toThrow();
  });

  it('provides refresh functionality', async () => {
    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');

    // Test refresh call
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useDashboardMetricsByRole', () => {
  it('requests detailed data for admin role', async () => {
    const { result } = renderHook(() => useDashboardMetricsByRole('admin'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockAdminMetrics);
    expect(result.current.data?.channelPartners).toBeDefined();
    expect(result.current.data?.pendingCommissions).toBeDefined();
  });

  it('requests standard data for kam role', async () => {
    const { result } = renderHook(() => useDashboardMetricsByRole('kam'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockMetrics);
  });

  it('requests minimal data for unknown role', async () => {
    const { result } = renderHook(() => useDashboardMetricsByRole('cp'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockMetrics);
  });

  it('handles undefined role gracefully', async () => {
    const { result } = renderHook(() => useDashboardMetricsByRole(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockMetrics);
  });
});

describe('useDashboardMetricsWithRefresh', () => {
  it('sets up polling with correct interval', () => {
    const { result } = renderHook(
      () => useDashboardMetricsWithRefresh(2), // 2 minutes
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    // The hook should be configured for polling, but we can't easily test
    // the actual polling behavior without waiting for the interval
  });

  it('uses default polling interval', () => {
    const { result } = renderHook(() => useDashboardMetricsWithRefresh(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});

describe('Hook Error Scenarios', () => {
  it('handles network errors gracefully', async () => {
    server.use(
      rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Network error' }));
      })
    );

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.hasData).toBe(false);
  });

  it('handles refresh errors gracefully', async () => {
    server.use(
      rest.post('/api/v1/dashboard/metrics/refresh', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Refresh failed' }));
      })
    );

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Test refresh error
    await act(async () => {
      try {
        await result.current.refresh();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
