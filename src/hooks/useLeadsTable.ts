/**
 * Custom hook for lead table management
 * Handles filtering, pagination, sorting, and data fetching
 */

import { useState, useCallback, useMemo } from 'react';
import { useGetLeadsQuery } from '../api/endpoints/leadEndpoints';
import { useLeadAccess } from './useLeadAccess';
import type { LeadQuery } from '../types/lead.types';

/**
 * Hook options interface
 */
export interface UseLeadsTableOptions {
  initialPageSize?: number;
  initialSort?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  enablePolling?: boolean;
  pollingInterval?: number;
}

/**
 * Hook return interface
 */
export interface UseLeadsTableReturn {
  // Data
  leads: any[];
  total: number;

  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: any;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;

  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Filtering
  filters: LeadQuery;

  // Actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setFilters: (filters: LeadQuery) => void;
  clearFilters: () => void;
  refresh: () => void;

  // Selection
  selectedLeads: string[];
  setSelectedLeads: (selected: string[]) => void;
  selectAll: (selected: boolean) => void;
  selectLead: (leadId: string, selected: boolean) => void;

  // Derived state
  hasFilters: boolean;
  isEmpty: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Default filters
 */
const defaultFilters: LeadQuery = {
  offset: 0,
  limit: 25,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Custom hook for leads table management
 */
export const useLeadsTable = (
  options: UseLeadsTableOptions = {}
): UseLeadsTableReturn => {
  const {
    initialPageSize = 25,
    initialSort = { sortBy: 'createdAt', sortOrder: 'desc' },
    enablePolling = false,
    pollingInterval = 30000,
  } = options;

  const { filterAccessibleLeads } = useLeadAccess();

  // Local state
  const [page, setPageState] = useState(0); // MUI uses 0-based pagination
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [sortBy, setSortByState] = useState(initialSort.sortBy);
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(
    initialSort.sortOrder
  );
  const [filters, setFiltersState] = useState<LeadQuery>(defaultFilters);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Build query parameters
  const queryParams = useMemo(
    (): LeadQuery => ({
      ...filters,
      offset: page * pageSize,
      limit: pageSize,
      sortBy: sortBy as any,
      sortOrder,
    }),
    [filters, page, pageSize, sortBy, sortOrder]
  );

  // Main query
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetLeadsQuery(queryParams, {
      pollingInterval: enablePolling ? pollingInterval : 0,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    });

  // Extract data with client-side territory filtering as fallback
  const leads = useMemo(() => {
    if (!data?.data.items) return [];

    // Apply client-side filtering as additional security layer
    return filterAccessibleLeads(data.data.items);
  }, [data?.data.items, filterAccessibleLeads]);

  const total = data?.data.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Actions
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
    setSelectedLeads([]); // Clear selection on page change
  }, []);

  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeState(newPageSize);
    setPageState(0); // Reset to first page
    setSelectedLeads([]); // Clear selection
  }, []);

  const setSorting = useCallback(
    (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
      setSortByState(newSortBy);
      setSortOrderState(newSortOrder);
    },
    []
  );

  const setFilters = useCallback((newFilters: LeadQuery) => {
    setFiltersState(newFilters);
    setPageState(0); // Reset to first page when filters change
    setSelectedLeads([]); // Clear selection
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPageState(0);
    setSelectedLeads([]);
  }, []);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Selection management
  const selectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedLeads(leads.map(lead => lead.id));
      } else {
        setSelectedLeads([]);
      }
    },
    [leads]
  );

  const selectLead = useCallback((leadId: string, selected: boolean) => {
    setSelectedLeads(prev => {
      if (selected) {
        return [...prev, leadId];
      } else {
        return prev.filter(id => id !== leadId);
      }
    });
  }, []);

  // Derived state
  const hasFilters = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.status ||
        filters.origin ||
        filters.territory ||
        filters.state ||
        filters.assignedCP ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.followUpDateFrom ||
        filters.followUpDateTo
    );
  }, [filters]);

  const isEmpty = leads.length === 0 && !isLoading;
  const hasNextPage = page < totalPages - 1;
  const hasPreviousPage = page > 0;

  return {
    // Data
    leads,
    total,

    // Loading states
    isLoading,
    isFetching,
    isError,
    error,

    // Pagination
    page,
    pageSize,
    totalPages,

    // Sorting
    sortBy,
    sortOrder,

    // Filtering
    filters,

    // Actions
    setPage,
    setPageSize,
    setSorting,
    setFilters,
    clearFilters,
    refresh,

    // Selection
    selectedLeads,
    setSelectedLeads,
    selectAll,
    selectLead,

    // Derived state
    hasFilters,
    isEmpty,
    hasNextPage,
    hasPreviousPage,
  };
};

export default useLeadsTable;
