/**
 * Profile and Notification type definitions for Solarium Web Portal
 * Defines interfaces for user profile management and notification system
 */

/**
 * User profile interface (extends base User but focused on editable fields)
 */
export interface UserProfile {
  id: string;
  email: string; // Read-only in profile context
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  timezone?: string;
  language?: string;

  // Metadata
  lastLoginAt?: string;
  updatedAt: string;
}

/**
 * Profile update payload interface
 */
export interface ProfileUpdatePayload {
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
}

/**
 * Password change payload interface
 */
export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password change response interface
 */
export interface PasswordChangeResponse {
  success: boolean;
  message: string;
  requiresReauth?: boolean;
}

/**
 * Notification type enumeration
 */
export type NotificationType =
  | 'system'
  | 'security'
  | 'lead'
  | 'quotation'
  | 'commission'
  | 'general';

/**
 * Notification status enumeration
 */
export type NotificationStatus = 'unread' | 'read';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  data?: Record<string, any>; // Additional notification data

  // Timestamps
  createdAt: string;
  readAt?: string;

  // Optional action data
  actionUrl?: string;
  actionText?: string;

  // Priority (for future sorting/filtering)
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Notification query parameters interface
 */
export interface NotificationQuery {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: NotificationType;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Notification list response interface
 */
export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

/**
 * Mark notification read payload
 */
export interface MarkNotificationReadPayload {
  id: string;
}

/**
 * Mark all notifications read response
 */
export interface MarkAllReadResponse {
  markedCount: number;
  message: string;
}

/**
 * Profile API error interface
 */
export interface ProfileApiError {
  status: number;
  message: string;
  field?: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Avatar upload response interface
 */
export interface AvatarUploadResponse {
  avatarUrl: string;
  message: string;
}

/**
 * Export commonly used notification filters
 */
export const NOTIFICATION_FILTERS = {
  ALL: undefined,
  UNREAD: 'unread' as NotificationStatus,
  READ: 'read' as NotificationStatus,
} as const;

export const NOTIFICATION_TYPES = {
  SYSTEM: 'system' as NotificationType,
  SECURITY: 'security' as NotificationType,
  LEAD: 'lead' as NotificationType,
  QUOTATION: 'quotation' as NotificationType,
  COMMISSION: 'commission' as NotificationType,
  GENERAL: 'general' as NotificationType,
} as const;
