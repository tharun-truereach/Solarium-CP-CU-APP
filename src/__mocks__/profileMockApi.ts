/**
 * Mock Profile API for development and testing
 * Provides realistic profile management endpoints
 */
import { rest } from 'msw';
import type { UserProfile } from '../types/profile.types';
import type {
  Notification,
  NotificationResponse,
  NotificationQuery,
} from '../types/notification.types';

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Lead Assignment',
    message: 'You have been assigned a new lead: ABC Corporation',
    type: 'lead',
    severity: 'info',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    metadata: {
      leadId: 'lead-123',
      priority: 'high',
    },
  },
  {
    id: '2',
    title: 'Quotation Approved',
    message: 'Your quotation Q-2024-001 has been approved by the customer',
    type: 'quotation',
    severity: 'success',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    metadata: {
      quotationId: 'Q-2024-001',
      priority: 'medium',
    },
  },
  {
    id: '3',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM',
    type: 'system',
    severity: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    metadata: {
      priority: 'medium',
    },
  },
  {
    id: '4',
    title: 'Commission Payment',
    message: 'Your commission payment of $2,500 has been processed',
    type: 'commission',
    severity: 'success',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    metadata: {
      amount: 2500,
      priority: 'low',
    },
  },
  {
    id: '5',
    title: 'Security Alert',
    message: 'Unusual login activity detected from a new device',
    type: 'security',
    severity: 'error',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    metadata: {
      priority: 'high',
      device: 'Chrome on Windows',
    },
  },
];

/**
 * MSW handlers for profile and notification endpoints
 */
export const profileMockHandlers = [
  // Get current user profile - /user/me
  rest.get(/.*\/user\/me$/, (req, res, ctx) => {
    console.log('🎯 MSW: Get profile handler called!', req.url.href);

    const profile: UserProfile = {
      id: '1',
      email: 'admin@solarium.com',
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '+1-555-0101',
      timezone: 'America/New_York',
      language: 'en',
      avatar: '',
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ Returning profile for:', profile.name);
    return res(ctx.json(profile));
  }),

  // Update user profile - /user/me
  rest.patch(/.*\/user\/me$/, async (req, res, ctx) => {
    console.log('🎯 MSW: Update profile handler called!', req.url.href);

    try {
      const updateData = await req.json();
      console.log('📝 Profile update data:', updateData);

      const updatedProfile: UserProfile = {
        id: '1',
        email: 'admin@solarium.com',
        name: updateData.name || 'Admin User',
        firstName: updateData.firstName || 'Admin',
        lastName: updateData.lastName || 'User',
        phoneNumber: updateData.phoneNumber || '+1-555-0101',
        timezone: updateData.timezone || 'America/New_York',
        language: updateData.language || 'en',
        avatar: '',
        updatedAt: new Date().toISOString(),
      };

      console.log('✅ Profile updated successfully:', updatedProfile.name);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return res(ctx.json(updatedProfile));
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return res(
        ctx.status(500),
        ctx.json({ message: 'Internal server error' })
      );
    }
  }),

  // Change password - /user/change-password
  rest.post(/.*\/user\/change-password$/, async (req, res, ctx) => {
    console.log('🎯 MSW: Change password handler called!', req.url.href);

    await new Promise(resolve => setTimeout(resolve, 800));

    return res(
      ctx.json({
        message: 'Password changed successfully',
        requiresReauth: false,
      })
    );
  }),

  // Upload avatar - /user/avatar
  rest.post(/.*\/user\/avatar$/, async (req, res, ctx) => {
    console.log('🎯 MSW: Upload avatar handler called!', req.url.href);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=AdminUser&backgroundColor=1976d2&color=ffffff`;

    return res(
      ctx.json({
        avatarUrl,
        message: 'Avatar uploaded successfully',
      })
    );
  }),

  // Get notifications - /api/v1/notifications
  rest.get(/.*\/api\/v1\/notifications.*/, (req, res, ctx) => {
    console.log('🎯 MSW: Get notifications handler called!', req.url.href);

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    let filteredNotifications = [...mockNotifications];

    // Apply filters
    if (status && status !== 'all') {
      filteredNotifications = filteredNotifications.filter(n =>
        status === 'unread' ? !n.read : n.read
      );
    }

    if (type && type !== 'all') {
      filteredNotifications = filteredNotifications.filter(
        n => n.type === type
      );
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = filteredNotifications.slice(
      startIndex,
      endIndex
    );

    const unreadCount = mockNotifications.filter(n => !n.read).length;

    const response: NotificationResponse = {
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(filteredNotifications.length / limit),
    };

    console.log('✅ Returning notifications:', {
      total: response.total,
      unreadCount: response.unreadCount,
      page: response.page,
      returned: paginatedNotifications.length,
    });

    return res(ctx.json(response));
  }),

  // Mark notification as read - /api/v1/notifications/{id}/read
  rest.patch(
    /.*\/api\/v1\/notifications\/(.+)\/read$/,
    async (req, res, ctx) => {
      const notificationId = req.params[0] as string;
      console.log('🎯 MSW: Mark notification as read:', notificationId);

      // Find and update the notification
      const notification = mockNotifications.find(n => n.id === notificationId);
      if (!notification) {
        return res(
          ctx.status(404),
          ctx.json({ message: 'Notification not found' })
        );
      }

      // Mark as read
      notification.read = true;

      console.log('✅ Notification marked as read:', notificationId);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return res(ctx.json(notification));
    }
  ),

  // Mark all notifications as read - /api/v1/notifications/mark-all-read
  rest.patch(
    /.*\/api\/v1\/notifications\/mark-all-read$/,
    async (req, res, ctx) => {
      console.log('🎯 MSW: Mark all notifications as read');

      // Mark all as read
      const unreadNotifications = mockNotifications.filter(n => !n.read);
      unreadNotifications.forEach(n => (n.read = true));

      console.log(
        '✅ All notifications marked as read:',
        unreadNotifications.length
      );

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return res(ctx.json({ count: unreadNotifications.length }));
    }
  ),
];
