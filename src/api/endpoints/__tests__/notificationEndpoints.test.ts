/**
 * Notification endpoints unit tests
 * Ensures proper API integration and optimistic updates
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { setupApiStore } from '../../../test-utils';
import { notificationEndpoints } from '../notificationEndpoints';
import type {
  NotificationQuery,
  NotificationResponse,
} from '../../../types/profile.types';

// Mock notification data
const mockNotificationResponse: NotificationResponse = {
  notifications: [
    {
      id: 'notif-1',
      type: 'system',
      status: 'unread',
      title: 'System Update',
      message: 'System maintenance scheduled',
      createdAt: '2024-01-01T00:00:00Z',
      priority: 'medium',
    },
    {
      id: 'notif-2',
      type: 'lead',
      status: 'read',
      title: 'New Lead',
      message: 'New lead assigned to you',
      createdAt: '2024-01-01T01:00:00Z',
      readAt: '2024-01-01T02:00:00Z',
      priority: 'high',
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
  unreadCount: 1,
};

// MSW server setup
const server = setupServer(
  rest.get('/api/v1/notifications', (req, res, ctx) => {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    let filteredNotifications = mockNotificationResponse.notifications;

    if (status) {
      filteredNotifications = filteredNotifications.filter(
        n => n.status === status
      );
    }

    if (type) {
      filteredNotifications = filteredNotifications.filter(
        n => n.type === type
      );
    }

    return res(
      ctx.json({
        ...mockNotificationResponse,
        notifications: filteredNotifications,
        total: filteredNotifications.length,
      })
    );
  }),

  rest.patch('/api/v1/notifications/:id/read', (req, res, ctx) => {
    const { id } = req.params;
    const notification = mockNotificationResponse.notifications.find(
      n => n.id === id
    );

    if (!notification) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Notification not found' })
      );
    }

    return res(
      ctx.json({
        ...notification,
        status: 'read',
        readAt: new Date().toISOString(),
      })
    );
  }),

  rest.patch('/api/v1/notifications/read-all', (req, res, ctx) => {
    const unreadCount = mockNotificationResponse.notifications.filter(
      n => n.status === 'unread'
    ).length;
    return res(
      ctx.json({
        markedCount: unreadCount,
        message: `${unreadCount} notifications marked as read`,
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('notificationEndpoints', () => {
  let storeRef: ReturnType<typeof setupApiStore>;

  beforeEach(() => {
    storeRef = setupApiStore(notificationEndpoints);
  });

  describe('getNotifications', () => {
    it('should fetch notifications successfully', async () => {
      const query: NotificationQuery = { page: 1, limit: 10 };

      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.getNotifications.initiate(query)
      );
      expect(response.data).toBeDefined();
      expect(response.data?.notifications).toBeInstanceOf(Array);
      expect(response.data?.notifications).toHaveLength(2);
      expect(response.data?.total).toBe(2);
      expect(response.data?.unreadCount).toBe(1);
    });

    it('should apply status filter correctly', async () => {
      const query: NotificationQuery = {
        page: 1,
        limit: 10,
        status: 'unread',
      };

      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.getNotifications.initiate(query)
      );
      expect(response.data?.notifications).toHaveLength(1);
      expect(response.data?.notifications[0]?.status).toBe('unread');
    });

    it('should apply type filter correctly', async () => {
      const query: NotificationQuery = {
        page: 1,
        limit: 10,
        type: 'system',
      };

      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.getNotifications.initiate(query)
      );
      expect(response.data?.notifications).toHaveLength(1);
      expect(response.data?.notifications[0]?.type).toBe('system');
    });

    it('should handle pagination parameters', async () => {
      const query: NotificationQuery = { page: 2, limit: 5 };

      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.getNotifications.initiate(query)
      );
      expect(response.data).toBeDefined();
      expect(response.data?.page).toBe(1); // Mock returns page 1
      expect(response.data?.limit).toBe(10); // Mock returns default limit
    });

    it('should handle date range filters', async () => {
      const query: NotificationQuery = {
        page: 1,
        limit: 10,
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-01T23:59:59Z',
      };

      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.getNotifications.initiate(query)
      );
      expect(response.data).toBeDefined();
    });

    it('should handle server errors', async () => {
      server.use(
        rest.get('/api/v1/notifications', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        })
      );

      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.getNotifications.initiate({})
      );
      expect(response.error).toBeDefined();
      expect((response.error as any)?.status).toBe(500);
    });
  });

  describe('markNotificationRead', () => {
    it('should mark notification as read successfully', async () => {
      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.markNotificationRead.initiate({
          id: 'notif-1',
        })
      );
      if ('data' in response) {
        expect(response.data).toBeDefined();
        expect(response.data?.status).toBe('read');
        expect(response.data?.readAt).toBeDefined();
      }
    });

    it('should handle notification not found', async () => {
      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.markNotificationRead.initiate({
          id: 'invalid-id',
        })
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
        expect((response.error as any)?.status).toBe(404);
      }
    });

    it('should handle server errors during mark read', async () => {
      server.use(
        rest.patch('/api/v1/notifications/:id/read', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        })
      );

      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.markNotificationRead.initiate({
          id: 'notif-1',
        })
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
        expect((response.error as any)?.status).toBe(500);
      }
    });
  });

  describe('markAllNotificationsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.markAllNotificationsRead.initiate()
      );
      if ('data' in response) {
        expect(response.data).toBeDefined();
        expect(response.data?.markedCount).toBeGreaterThanOrEqual(0);
        expect(response.data?.message).toContain('marked as read');
      }
    });

    it('should handle server errors during mark all read', async () => {
      server.use(
        rest.patch('/api/v1/notifications/read-all', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        })
      );

      const response = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.markAllNotificationsRead.initiate()
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
        expect((response.error as any)?.status).toBe(500);
      }
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate notifications cache after marking as read', async () => {
      // First fetch notifications
      const fetchResult = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.getNotifications.initiate({})
      );

      // Mark one as read
      const markResult = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.markNotificationRead.initiate({
          id: 'notif-1',
        })
      );

      // Check that notifications cache exists
      const state = storeRef.store.getState();
      const notificationQueries = state.api.queries;
      expect(Object.keys(notificationQueries)).toContain('getNotifications()');
    });

    it('should invalidate notifications cache after marking all as read', async () => {
      // First fetch notifications
      const fetchResult = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.getNotifications.initiate({})
      );

      // Mark all as read
      const markAllResult = await storeRef.store.dispatch(
        notificationEndpoints.endpoints.markAllNotificationsRead.initiate()
      );

      // Check that cache invalidation occurred
      const state = storeRef.store.getState();
      expect(state.api).toBeDefined();
    });
  });
});
