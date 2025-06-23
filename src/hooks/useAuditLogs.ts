/**
 * Custom hook for audit logs management
 * Wraps useGetAuditLogsQuery with enhanced functionality and state management
 */

import { useState, useMemo } from 'react';
import { useGetAuditLogsQuery } from '../api/endpoints/settingsEndpoints';
import type { AuditQuery, SettingsAuditLog } from '../types/settings.types';

/**
 * Audit logs hook configuration
 */
interface UseAuditLogsConfig {
  initialPage?: number;
  initialPageSize?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  pollingInterval?: number;
}

/**
 * Audit logs hook return type
 */
interface UseAuditLogsReturn {
  // Data
  logs: SettingsAuditLog[];
  total: number;
  totalPages: number;

  // Pagination state
  page: number;
  pageSize: number;

  // Sorting state
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: any;

  // Actions
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSorting: (field: string, order: 'asc' | 'desc') => void;
  refresh: () => void;

  // Filters
  filters: Omit<AuditQuery, 'page' | 'limit'>;
  setFilters: (filters: Partial<Omit<AuditQuery, 'page' | 'limit'>>) => void;
  clearFilters: () => void;

  // Utilities
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isEmpty: boolean;
}

/**
 * Custom hook for managing audit logs with pagination, sorting, and filtering
 */
export const useAuditLogs = (
  config: UseAuditLogsConfig = {}
): UseAuditLogsReturn => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialSortBy = 'timestamp',
    initialSortOrder = 'desc',
    pollingInterval,
  } = config;

  // State management
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [filters, setFilters] = useState<Omit<AuditQuery, 'page' | 'limit'>>(
    {}
  );

  // Build query parameters
  const queryParams = useMemo(
    (): AuditQuery => ({
      page,
      limit: pageSize,
      ...filters,
    }),
    [page, pageSize, filters]
  );

  // RTK Query hook
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAuditLogsQuery(queryParams, {
      ...(pollingInterval && { pollingInterval }),
      refetchOnMountOrArgChange: true,
    });

  // Derived state
  const logs = useMemo(() => {
    if (!data?.logs) return [];

    // Apply client-side sorting if needed
    const sortedLogs = [...data.logs];

    if (sortBy && sortBy !== 'timestamp') {
      sortedLogs.sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default timestamp sorting (server handles this)
      sortedLogs.sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      });
    }

    return sortedLogs;
  }, [data?.logs, sortBy, sortOrder]);

  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const isEmpty = total === 0;

  // Action handlers
  const handleSetPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleSetPageSize = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handleSetSorting = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleSetFilters = (
    newFilters: Partial<Omit<AuditQuery, 'page' | 'limit'>>
  ) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const refresh = () => {
    refetch();
  };

  return {
    // Data
    logs,
    total,
    totalPages,

    // Pagination state
    page,
    pageSize,

    // Sorting state
    sortBy,
    sortOrder,

    // Loading states
    isLoading,
    isFetching,
    isError,
    error,

    // Actions
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setSorting: handleSetSorting,
    refresh,

    // Filters
    filters,
    setFilters: handleSetFilters,
    clearFilters: handleClearFilters,

    // Utilities
    hasNextPage,
    hasPreviousPage,
    isEmpty,
  };
};

export default useAuditLogs;
