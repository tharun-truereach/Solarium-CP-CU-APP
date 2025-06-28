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
  initialFilters?: LeadQuery;
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
export const useLeadsTable = ({
  initialPageSize = 10,
  initialFilters = defaultFilters,
}: UseLeadsTableOptions = {}) => {
  // State
  const [pageState, setPageState] = useState(0);
  const [pageSizeState, setPageSizeState] = useState(initialPageSize);
  const [filtersState, setFiltersState] = useState<LeadQuery>(initialFilters);
  const [sortByState, setSortByState] = useState<
    'createdAt' | 'updatedAt' | 'followUpDate' | 'customerName' | 'status'
  >('createdAt');
  const [sortOrderState, setSortOrderState] = useState<'asc' | 'desc'>('desc');

  // Query
  const { data, isLoading, isError, isFetching, error, refetch } =
    useGetLeadsQuery({
      offset: pageState * pageSizeState,
      limit: pageSizeState,
      ...filtersState,
      sortBy: sortByState,
      sortOrder: sortOrderState,
    });

  // Extract data
  const leads = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 0;

  // Actions
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeState(newPageSize);
    setPageState(0); // Reset to first page
  }, []);

  const setSorting = useCallback(
    (
      newSortBy:
        | 'createdAt'
        | 'updatedAt'
        | 'followUpDate'
        | 'customerName'
        | 'status',
      newSortOrder: 'asc' | 'desc'
    ) => {
      setSortByState(newSortBy);
      setSortOrderState(newSortOrder);
    },
    []
  );

  const setFilters = useCallback((newFilters: LeadQuery) => {
    setFiltersState(newFilters);
    setPageState(0); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPageState(0);
  }, []);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Derived state
  const hasFilters = useMemo(() => {
    return Boolean(
      filtersState.search ||
        filtersState.status ||
        filtersState.origin ||
        filtersState.territory ||
        filtersState.state ||
        filtersState.assignedCP ||
        filtersState.dateFrom ||
        filtersState.dateTo ||
        filtersState.followUpDateFrom ||
        filtersState.followUpDateTo
    );
  }, [filtersState]);

  const isEmpty = leads.length === 0 && !isLoading;
  const hasNextPage = pageState < totalPages - 1;
  const hasPreviousPage = pageState > 0;

  return {
    leads,
    total,
    isLoading,
    isError,
    isFetching,
    error,
    filters: filtersState,
    sortBy: sortByState,
    sortOrder: sortOrderState,
    page: pageState,
    pageSize: pageSizeState,
    totalPages,
    setFilters,
    setSorting,
    setPage,
    setPageSize,
    clearFilters,
    refresh,
    isEmpty,
    hasFilters,
    hasNextPage,
    hasPreviousPage,
  };
};

export default useLeadsTable;
