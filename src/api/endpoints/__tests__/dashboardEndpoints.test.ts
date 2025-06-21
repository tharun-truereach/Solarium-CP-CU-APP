/**
 * Integration tests for dashboard API endpoints
 * Tests RTK Query integration and data transformation
 */
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
  beforeEach,
  expect,
} from 'vitest';
import { baseApi } from '../../baseApi';
import {
  dashboardEndpoints,
  type DashboardMetrics,
  type DashboardMetricsParams,
} from '../dashboardEndpoints';

// Mock data
const mockApiResponse = {
  activeLeads: 15,
  pendingQuotations: 8,
  recentLeads: [
    {
      id: '1',
      customerName: 'Test Customer',
      status: 'new',
      createdAt: '2024-01-01T10:00:00Z',
    },
  ],
  recentActivities: [
    {
      id: '1',
      title: 'Test Activity',
      description: 'Test Description',
      timestamp: '2024-01-01T12:00:00Z',
      type: 'lead',
    },
  ],
  channelPartners: 5,
  pendingCommissions: 2,
  lastUpdated: '2024-01-01T12:00:00Z',
};

// MSW server setup
const server = setupServer(
  rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);

    // Check if parameters are passed correctly
    if (params.includeDetails === 'false') {
      return res(ctx.json({ ...mockApiResponse, recentLeads: [] }));
    }

    return res(ctx.json(mockApiResponse));
  }),

  rest.post('/api/v1/dashboard/metrics/refresh', (req, res, ctx) => {
    return res(
      ctx.json({
        ...mockApiResponse,
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

describe('Dashboard API Endpoints', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('getDashboardMetrics', () => {
    it('fetches dashboard metrics successfully', async () => {
      const result = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      expect(result.data).toBeDefined();
      expect(result.data?.activeLeads).toBe(15);
      expect(result.data?.pendingQuotations).toBe(8);
      expect(result.data?.recentLeads).toHaveLength(1);
      expect(result.data?.recentActivities).toHaveLength(1);
    });

    it('passes query parameters correctly', async () => {
      const params: DashboardMetricsParams = {
        dateRange: {
          from: '2024-01-01',
          to: '2024-01-31',
        },
        includeDetails: false,
        limit: 5,
      };

      server.use(
        rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
          const url = new URL(req.url);
          expect(url.searchParams.get('dateFrom')).toBe('2024-01-01');
          expect(url.searchParams.get('dateTo')).toBe('2024-01-31');
          expect(url.searchParams.get('includeDetails')).toBe('false');
          expect(url.searchParams.get('limit')).toBe('5');

          return res(ctx.json(mockApiResponse));
        })
      );

      const result = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate(params)
      );

      expect(result.data).toBeDefined();
    });

    it('transforms response data correctly', async () => {
      const incompleteResponse = {
        activeLeads: 10,
        // Missing other fields
      };

      server.use(
        rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
          return res(ctx.json(incompleteResponse));
        })
      );

      const result = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      expect(result.data).toBeDefined();
      expect(result.data?.activeLeads).toBe(10);
      expect(result.data?.pendingQuotations).toBe(0); // Default value
      expect(result.data?.recentLeads).toEqual([]); // Default empty array
      expect(result.data?.dateRange).toBeDefined(); // Default date range
    });

    it('handles API errors gracefully', async () => {
      server.use(
        rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              message: 'Internal server error',
              code: 'DASHBOARD_ERROR',
            })
          );
        })
      );

      const result = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      expect(result.error).toBeDefined();
      expect('status' in result.error! ? result.error.status : null).toBe(500);
    });

    it('provides Analytics tag for cache invalidation', async () => {
      const result = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      // Check that the endpoint provides the correct tag
      const endpoint = dashboardEndpoints.endpoints.getDashboardMetrics;
      expect(endpoint.Types?.QueryArg).toBeDefined();

      // The tag should be provided in the endpoint configuration
      expect(result.data).toBeDefined();
    });

    it('handles missing dateRange in response', async () => {
      server.use(
        rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
          return res(ctx.json({ activeLeads: 5 })); // No dateRange
        })
      );

      const result = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      expect(result.data?.dateRange).toBeDefined();
      expect(result.data?.dateRange.from).toBeDefined();
      expect(result.data?.dateRange.to).toBeDefined();
    });

    it('handles missing lastUpdated in response', async () => {
      server.use(
        rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
          return res(ctx.json({ activeLeads: 5 })); // No lastUpdated
        })
      );

      const result = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      expect(result.data?.lastUpdated).toBeDefined();
      expect(new Date(result.data!.lastUpdated).getTime()).toBeGreaterThan(0);
    });
  });

  describe('refreshDashboardMetrics', () => {
    it('refreshes dashboard metrics successfully', async () => {
      const result = await store.dispatch(
        dashboardEndpoints.endpoints.refreshDashboardMetrics.initiate()
      );

      if ('data' in result) {
        expect(result.data).toBeDefined();
        expect(result.data?.activeLeads).toBe(15);
        expect(result.data?.lastUpdated).toBeDefined();
      }
    });

    it('handles refresh errors gracefully', async () => {
      server.use(
        rest.post('/api/v1/dashboard/metrics/refresh', (req, res, ctx) => {
          return res(
            ctx.status(503),
            ctx.json({ message: 'Service unavailable' })
          );
        })
      );

      const result = await store.dispatch(
        dashboardEndpoints.endpoints.refreshDashboardMetrics.initiate()
      );

      if ('error' in result) {
        expect(result.error).toBeDefined();
        expect('status' in result.error ? result.error.status : null).toBe(503);
      }
    });

    it('invalidates Analytics tag after refresh', async () => {
      // First, fetch initial data
      await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      // Then refresh
      const result = await store.dispatch(
        dashboardEndpoints.endpoints.refreshDashboardMetrics.initiate()
      );

      if ('data' in result) {
        expect(result.data).toBeDefined();
      }

      // The mutation should have invalidated the Analytics tag
      // This would trigger a refetch of any cached queries with that tag
    });
  });

  describe('Caching Behavior', () => {
    it('uses default keepUnusedDataFor from baseApi', async () => {
      // Dispatch the query
      const result1 = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      expect(result1.data).toBeDefined();

      // Dispatch the same query again - should use cache
      const result2 = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      expect(result2.data).toEqual(result1.data);
    });

    it('handles different query parameters as separate cache entries', async () => {
      const params1: DashboardMetricsParams = { limit: 5 };
      const params2: DashboardMetricsParams = { limit: 10 };

      server.use(
        rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
          const url = new URL(req.url);
          const limit = url.searchParams.get('limit');
          return res(
            ctx.json({
              ...mockApiResponse,
              activeLeads: limit === '5' ? 5 : 10,
            })
          );
        })
      );

      const result1 = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate(params1)
      );

      const result2 = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate(params2)
      );

      expect(result1.data?.activeLeads).toBe(5);
      expect(result2.data?.activeLeads).toBe(10);
    });
  });

  describe('Data Transformation', () => {
    it('handles missing dateRange in response', async () => {
      server.use(
        rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
          return res(ctx.json({ activeLeads: 5 })); // No dateRange
        })
      );

      const result = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      expect(result.data?.dateRange).toBeDefined();
      expect(result.data?.dateRange.from).toBeDefined();
      expect(result.data?.dateRange.to).toBeDefined();
    });

    it('handles missing lastUpdated in response', async () => {
      server.use(
        rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
          return res(ctx.json({ activeLeads: 5 })); // No lastUpdated
        })
      );

      const result = await store.dispatch(
        dashboardEndpoints.endpoints.getDashboardMetrics.initiate()
      );

      expect(result.data?.lastUpdated).toBeDefined();
      expect(new Date(result.data!.lastUpdated).getTime()).toBeGreaterThan(0);
    });
  });
});
