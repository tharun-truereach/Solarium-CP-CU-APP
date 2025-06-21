/**
 * Dashboard API endpoints using RTK Query
 * Handles dashboard metrics and analytics data with simple caching strategy
 */

import { baseApi } from '../baseApi';

/**
 * Dashboard metrics data structure
 */
export interface DashboardMetrics {
  // Lead metrics
  activeLeads: number;
  pendingQuotations: number;
  recentLeads: Array<{
    id: string;
    customerName: string;
    status: string;
    createdAt: string;
  }>;

  // Performance metrics (Admin only)
  channelPartners?: number;
  pendingCommissions?: number;
  totalRevenue?: number;

  // Activity summary
  recentActivities: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'lead' | 'quotation' | 'commission' | 'system';
  }>;

  // Time range for metrics
  dateRange: {
    from: string;
    to: string;
  };

  // Metadata
  lastUpdated: string;
  refreshInterval?: number;
}

/**
 * Dashboard metrics query parameters
 */
export interface DashboardMetricsParams {
  dateRange?: {
    from?: string;
    to?: string;
  };
  includeDetails?: boolean;
  limit?: number;
}

/**
 * Dashboard API endpoints
 * Uses existing 'Analytics' tag for simple cache management
 */
export const dashboardEndpoints = baseApi.injectEndpoints({
  endpoints: builder => ({
    /**
     * Get dashboard metrics
     * Simple endpoint with default caching behavior
     */
    getDashboardMetrics: builder.query<
      DashboardMetrics,
      DashboardMetricsParams | void
    >({
      query: (params = {}) => {
        const queryParams = params || {};
        return {
          url: '/dashboard/metrics',
          method: 'GET',
          params: {
            // Default parameters
            includeDetails: true,
            limit: 10,
            ...queryParams,
            // Serialize date range if provided
            ...(queryParams.dateRange && {
              dateFrom: queryParams.dateRange.from,
              dateTo: queryParams.dateRange.to,
            }),
          },
        };
      },

      // Use existing Analytics tag for cache invalidation
      providesTags: ['Analytics'],

      // Use baseApi default keepUnusedDataFor (60 seconds)
      // No custom cache configuration needed for KISS implementation

      // Transform and validate response
      transformResponse: (response: any): DashboardMetrics => {
        // Basic validation and normalization
        return {
          activeLeads: response.activeLeads || 0,
          pendingQuotations: response.pendingQuotations || 0,
          recentLeads: response.recentLeads || [],
          channelPartners: response.channelPartners,
          pendingCommissions: response.pendingCommissions,
          totalRevenue: response.totalRevenue,
          recentActivities: response.recentActivities || [],
          dateRange: response.dateRange || {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            to: new Date().toISOString(),
          },
          lastUpdated: response.lastUpdated || new Date().toISOString(),
          refreshInterval: response.refreshInterval,
        };
      },

      // Handle API errors gracefully
      transformErrorResponse: (response: any) => {
        console.error('Dashboard metrics API error:', response);
        return {
          status: response.status || 500,
          message: response.data?.message || 'Failed to load dashboard metrics',
          data: response.data,
        };
      },
    }),

    /**
     * Refresh dashboard metrics
     * Simple mutation for manual refresh without complex invalidation
     */
    refreshDashboardMetrics: builder.mutation<DashboardMetrics, void>({
      query: () => ({
        url: '/dashboard/metrics/refresh',
        method: 'POST',
      }),

      // Invalidate Analytics tag to refresh cached data
      invalidatesTags: ['Analytics'],

      // Transform response same as query
      transformResponse: (response: any): DashboardMetrics => {
        return {
          activeLeads: response.activeLeads || 0,
          pendingQuotations: response.pendingQuotations || 0,
          recentLeads: response.recentLeads || [],
          channelPartners: response.channelPartners,
          pendingCommissions: response.pendingCommissions,
          totalRevenue: response.totalRevenue,
          recentActivities: response.recentActivities || [],
          dateRange: response.dateRange || {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
          lastUpdated: new Date().toISOString(),
          refreshInterval: response.refreshInterval,
        };
      },
    }),
  }),
  overrideExisting: false,
});

/**
 * Export hooks for use in components
 */
export const {
  useGetDashboardMetricsQuery,
  useRefreshDashboardMetricsMutation,
} = dashboardEndpoints;

/**
 * Export selectors for advanced usage
 */
export const dashboardSelectors =
  dashboardEndpoints.endpoints.getDashboardMetrics.select;

/**
 * Export endpoints for direct access
 */
export default dashboardEndpoints;
