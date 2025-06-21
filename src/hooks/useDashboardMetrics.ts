/**
 * Custom hook for dashboard metrics data management
 * Abstracts RTK Query specifics and provides clean interface for components
 */
import { useCallback, useMemo } from 'react';
import {
  useGetDashboardMetricsQuery,
  useRefreshDashboardMetricsMutation,
  type DashboardMetrics,
  type DashboardMetricsParams,
} from '../api/endpoints/dashboardEndpoints';

/**
 * Hook return interface
 */
export interface UseDashboardMetricsReturn {
  // Data state
  data: DashboardMetrics | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any;

  // Additional states
  isFetching: boolean;
  isSuccess: boolean;

  // Actions
  refetch: () => void;
  refresh: () => Promise<void>;

  // Computed values
  hasData: boolean;
  lastUpdated: string | null;
  metricsAge: number; // Age in minutes
}

/**
 * Dashboard metrics hook options
 */
export interface UseDashboardMetricsOptions {
  // Query parameters
  params?: DashboardMetricsParams;

  // Polling options (simple implementation)
  pollingInterval?: number;

  // Skip query execution
  skip?: boolean;

  // Refetch behavior
  refetchOnMount?: boolean;
  refetchOnFocus?: boolean;
}

/**
 * Custom hook for dashboard metrics with loading state management
 * Provides clean interface while abstracting RTK Query complexity
 *
 * @param options - Hook configuration options
 * @returns Dashboard metrics state and actions
 */
export const useDashboardMetrics = (
  options: UseDashboardMetricsOptions = {}
): UseDashboardMetricsReturn => {
  const {
    params,
    pollingInterval,
    skip = false,
    refetchOnMount = true,
    refetchOnFocus = true,
  } = options;

  // RTK Query hook with configuration
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    isSuccess,
    refetch: queryRefetch,
  } = useGetDashboardMetricsQuery(params, {
    skip,
    ...(pollingInterval && { pollingInterval }),
    refetchOnMountOrArgChange: refetchOnMount,
    refetchOnFocus,
    // Use default cache settings from baseApi
  });

  // Refresh mutation for manual refresh
  const [refreshMutation, { isLoading: isRefreshing }] =
    useRefreshDashboardMetricsMutation();

  /**
   * Manual refetch function
   */
  const refetch = useCallback(() => {
    queryRefetch();
  }, [queryRefetch]);

  /**
   * Refresh function using mutation
   */
  const refresh = useCallback(async () => {
    try {
      await refreshMutation().unwrap();
    } catch (error) {
      console.error('Failed to refresh dashboard metrics:', error);
      throw error;
    }
  }, [refreshMutation]);

  /**
   * Computed values
   */
  const computed = useMemo(() => {
    const hasData = Boolean(data && Object.keys(data).length > 0);
    const lastUpdated = data?.lastUpdated || null;

    // Calculate metrics age in minutes
    let metricsAge = 0;
    if (lastUpdated) {
      const lastUpdatedTime = new Date(lastUpdated).getTime();
      const now = Date.now();
      metricsAge = Math.floor((now - lastUpdatedTime) / (1000 * 60));
    }

    return {
      hasData,
      lastUpdated,
      metricsAge,
    };
  }, [data]);

  return {
    // Data state
    data,
    isLoading: isLoading || isRefreshing,
    isError,
    error,

    // Additional states
    isFetching,
    isSuccess,

    // Actions
    refetch,
    refresh,

    // Computed values
    ...computed,
  };
};

/**
 * Hook for dashboard metrics with automatic refresh
 * Convenience hook for components that need auto-refreshing data
 *
 * @param refreshIntervalMinutes - Refresh interval in minutes (default: 5)
 * @returns Dashboard metrics with auto-refresh
 */
export const useDashboardMetricsWithRefresh = (
  refreshIntervalMinutes: number = 5
): UseDashboardMetricsReturn => {
  return useDashboardMetrics({
    pollingInterval: refreshIntervalMinutes * 60 * 1000, // Convert to milliseconds
    refetchOnFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Hook for dashboard metrics with role-based parameters
 * Automatically adjusts query parameters based on user role
 *
 * @param userRole - Current user role
 * @returns Dashboard metrics filtered by role
 */
export const useDashboardMetricsByRole = (
  userRole?: string
): UseDashboardMetricsReturn => {
  const params = useMemo((): DashboardMetricsParams => {
    // Admin gets more detailed data
    if (userRole === 'admin') {
      return {
        includeDetails: true,
        limit: 20,
      };
    }

    // KAM gets standard data
    if (userRole === 'kam') {
      return {
        includeDetails: true,
        limit: 10,
      };
    }

    // Default minimal data
    return {
      includeDetails: false,
      limit: 5,
    };
  }, [userRole]);

  return useDashboardMetrics({ params });
};

export default useDashboardMetrics;
