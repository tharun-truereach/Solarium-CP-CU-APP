/**
 * Notification type definitions for Solarium Web Portal
 * Defines notification-related interfaces and types
 */

/**
 * Notification severity levels
 */
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

/**
 * Notification types
 */
export type NotificationType =
  | 'system'
  | 'security'
  | 'lead'
  | 'quotation'
  | 'commission'
  | 'user'
  | 'announcement';

/**
 * Notification status
 */
export type NotificationStatus = 'read' | 'unread';

/**
 * Individual notification interface
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: {
    leadId?: string;
    quotationId?: string;
    userId?: string;
    actionUrl?: string;
    [key: string]: any;
  };
}

/**
 * Notification filter interface
 */
export interface NotificationFilter {
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: 'low' | 'medium' | 'high';
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Notification list query parameters
 */
export interface NotificationQuery extends NotificationFilter {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'readAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Notification list response
 */
export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Mark notification as read payload
 */
export interface MarkNotificationReadPayload {
  notificationId: string;
}

/**
 * Mark all notifications as read payload
 */
export interface MarkAllNotificationsReadPayload {
  userId?: string;
}
