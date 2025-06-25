/**
 * Notification API endpoints using RTK Query
 * Handles notification fetching, marking as read, and polling
 */

import { apiSlice } from '../apiSlice';
import type {
  NotificationQuery,
  NotificationResponse,
  MarkNotificationReadPayload,
  MarkAllNotificationsReadPayload,
  Notification,
} from '../../types/notification.types';

/**
 * Notification endpoints extension of base API
 */
export const notificationEndpoints = apiSlice.injectEndpoints({
  endpoints: builder => ({
    /**
     * Get notifications with filtering and pagination
     */
    getNotifications: builder.query<NotificationResponse, NotificationQuery>({
      query: ({
        page = 1,
        limit = 20,
        status,
        type,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);

        if (status && status !== 'all') params.append('status', status);
        if (type && type !== 'all') params.append('type', type);
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);

        return {
          url: `/api/v1/notifications?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: result => [
        'Notification',
        ...(result?.notifications.map(({ id }) => ({
          type: 'Notification' as const,
          id,
        })) ?? []),
      ],
      transformResponse: (response: NotificationResponse) => {
        console.log('✅ Notifications loaded:', {
          total: response.total,
          unreadCount: response.unreadCount,
          page: response.page,
          notificationsCount: response.notifications.length,
        });
        return response;
      },
      transformErrorResponse: (response: any) => {
        console.error(
          '❌ Failed to load notifications:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message: response.data?.message || 'Failed to load notifications',
        };
      },
    }),

    /**
     * Mark single notification as read
     */
    markNotificationRead: builder.mutation<
      Notification,
      MarkNotificationReadPayload
    >({
      query: ({ notificationId }) => ({
        url: `/api/v1/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { notificationId }) => [
        'Notification',
        { type: 'Notification', id: notificationId },
      ],
      transformResponse: (response: Notification) => {
        console.log('✅ Notification marked as read:', response.id);
        return response;
      },
      transformErrorResponse: (response: any) => {
        console.error(
          '❌ Failed to mark notification as read:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message:
            response.data?.message || 'Failed to mark notification as read',
        };
      },
    }),

    /**
     * Mark all notifications as read
     */
    markAllNotificationsRead: builder.mutation<
      { count: number },
      MarkAllNotificationsReadPayload
    >({
      query: ({ userId } = {}) => ({
        url: '/api/v1/notifications/mark-all-read',
        method: 'PATCH',
        body: userId ? { userId } : {},
      }),
      invalidatesTags: ['Notification'],
      transformResponse: (response: { count: number }) => {
        console.log('✅ All notifications marked as read:', response.count);
        return response;
      },
      transformErrorResponse: (response: any) => {
        console.error(
          '❌ Failed to mark all notifications as read:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message:
            response.data?.message ||
            'Failed to mark all notifications as read',
        };
      },
    }),
  }),
  overrideExisting: true,
});

/**
 * Export hooks for use in components
 */
export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationEndpoints;

/**
 * Export endpoint selectors for advanced usage
 */
export const notificationSelectors = notificationEndpoints.endpoints;

/**
 * Export endpoints for direct access
 */
export default notificationEndpoints;
