/**
 * Custom hook for notification management with polling and filtering
 * Provides comprehensive notification state management with derived unread count
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../api/endpoints/notificationEndpoints';
import type {
  Notification,
  NotificationFilter,
  NotificationQuery,
} from '../types/notification.types';
import { config } from '../config/environment';

/**
 * Hook options interface
 */
export interface UseNotificationsOptions {
  pollingInterval?: number;
  pausePollingOnHidden?: boolean;
  initialFilter?: NotificationFilter;
  pageSize?: number;
}

/**
 * Hook return interface
 */
export interface UseNotificationsReturn {
  // Data
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  currentPage: number;
  totalPages: number;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: any;

  // Actions
  refresh: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;

  // Filtering
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  resetFilter: () => void;

  // Pagination
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Status flags
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isMarkingRead: boolean;
  isMarkingAllRead: boolean;
}

/**
 * Default filter state
 */
const defaultFilter: NotificationFilter = {
  status: 'all',
  type: 'all',
};

/**
 * Custom hook for notification management
 */
export const useNotifications = (
  options: UseNotificationsOptions = {}
): UseNotificationsReturn => {
  const {
    pollingInterval = config.notificationPollInterval,
    pausePollingOnHidden = true,
    initialFilter = defaultFilter,
    pageSize = 20,
  } = options;

  // Local state
  const [filter, setFilterState] = useState<NotificationFilter>(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDocumentHidden, setIsDocumentHidden] = useState(
    typeof document !== 'undefined' ? document.hidden : false
  );

  // Mutations
  const [markNotificationRead, { isLoading: isMarkingRead }] =
    useMarkNotificationReadMutation();
  const [markAllNotificationsRead, { isLoading: isMarkingAllRead }] =
    useMarkAllNotificationsReadMutation();

  // Document visibility tracking
  useEffect(() => {
    if (typeof document === 'undefined' || !pausePollingOnHidden) return;

    const handleVisibilityChange = () => {
      setIsDocumentHidden(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pausePollingOnHidden]);

  // Build query parameters
  const queryParams = useMemo(
    (): NotificationQuery => ({
      ...filter,
      page: currentPage,
      limit: pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    [filter, currentPage, pageSize]
  );

  // Determine polling interval (pause when document is hidden)
  const effectivePollingInterval = useMemo(() => {
    if (pausePollingOnHidden && isDocumentHidden) {
      return 0; // Disable polling when hidden
    }
    return pollingInterval;
  }, [pollingInterval, pausePollingOnHidden, isDocumentHidden]);

  // Main query with polling
  const { data, isLoading, isError, error, refetch } = useGetNotificationsQuery(
    queryParams,
    {
      pollingInterval: effectivePollingInterval,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skip: false,
    }
  );

  // Derived data
  const notifications = useMemo(() => data?.notifications || [], [data]);
  const unreadCount = useMemo(() => data?.unreadCount || 0, [data]);
  const totalCount = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(() => data?.totalPages || 1, [data]);

  // Pagination helpers
  const hasNextPage = useMemo(
    () => currentPage < totalPages,
    [currentPage, totalPages]
  );
  const hasPreviousPage = useMemo(() => currentPage > 1, [currentPage]);

  // Actions
  const refresh = useCallback(async (): Promise<void> => {
    try {
      await refetch().unwrap();
      console.log('🔄 Notifications refreshed manually');
    } catch (error) {
      console.error('❌ Failed to refresh notifications:', error);
      throw error;
    }
  }, [refetch]);

  const markRead = useCallback(
    async (notificationId: string): Promise<void> => {
      try {
        await markNotificationRead({ notificationId }).unwrap();
        console.log('✅ Notification marked as read:', notificationId);
      } catch (error) {
        console.error('❌ Failed to mark notification as read:', error);
        throw error;
      }
    },
    [markNotificationRead]
  );

  const markAllRead = useCallback(async (): Promise<void> => {
    try {
      const result = await markAllNotificationsRead({}).unwrap();
      console.log('✅ All notifications marked as read:', result.count);
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw error;
    }
  }, [markAllNotificationsRead]);

  // Filter management
  const setFilter = useCallback((newFilter: NotificationFilter) => {
    setFilterState(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const resetFilter = useCallback(() => {
    setFilterState(defaultFilter);
    setCurrentPage(1);
  }, []);

  // Pagination
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔔 useNotifications hook state:', {
        notifications: notifications.length,
        unreadCount,
        currentPage,
        totalPages,
        filter,
        isLoading,
        isError,
        pollingActive: effectivePollingInterval > 0,
        documentHidden: isDocumentHidden,
      });
    }
  }, [
    notifications.length,
    unreadCount,
    currentPage,
    totalPages,
    filter,
    isLoading,
    isError,
    effectivePollingInterval,
    isDocumentHidden,
  ]);

  return {
    // Data
    notifications,
    unreadCount,
    totalCount,
    currentPage,
    totalPages,

    // Loading states
    isLoading,
    isError,
    error,

    // Actions
    refresh,
    markRead,
    markAllRead,

    // Filtering
    filter,
    setFilter,
    resetFilter,

    // Pagination
    goToPage,
    nextPage,
    previousPage,

    // Status flags
    hasNextPage,
    hasPreviousPage,
    isMarkingRead,
    isMarkingAllRead,
  };
};

/**
 * Utility function to select unread count from notifications array
 * Can be used independently for components that only need the count
 */
export const selectUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter(notification => !notification.read).length;
};

/**
 * Utility function to filter notifications by criteria
 * Can be used for client-side filtering when needed
 */
export const filterNotifications = (
  notifications: Notification[],
  filter: NotificationFilter
): Notification[] => {
  return notifications.filter(notification => {
    // Status filter
    if (filter.status === 'read' && !notification.read) return false;
    if (filter.status === 'unread' && notification.read) return false;

    // Type filter
    if (
      filter.type &&
      filter.type !== 'all' &&
      notification.type !== filter.type
    )
      return false;

    // Date filters
    if (filter.dateFrom) {
      const notificationDate = new Date(notification.createdAt);
      const fromDate = new Date(filter.dateFrom);
      if (notificationDate < fromDate) return false;
    }

    if (filter.dateTo) {
      const notificationDate = new Date(notification.createdAt);
      const toDate = new Date(filter.dateTo);
      if (notificationDate > toDate) return false;
    }

    return true;
  });
};

/**
 * Export default for convenience
 */
export default useNotifications;
