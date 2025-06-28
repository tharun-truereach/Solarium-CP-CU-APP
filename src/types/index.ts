/**
 * Types barrel file for Solarium Web Portal
 * Re-exports all type definitions for easy importing
 */

// User types
export * from './user.types';

// Error types
export * from './error.types';

// Circuit Breaker types
export * from './circuitBreaker.types';

// Settings types
export * from './settings.types';

// Notification types
export * from './notification.types';

// Profile types (explicit exports to avoid conflicts with user.types)
export type {
  UserProfile,
  AvatarUploadResponse,
  Notification as ProfileNotification,
  ProfileApiError,
} from './profile.types';

// Re-export profile-specific versions with different names to avoid conflicts
export type {
  PasswordChangePayload as ProfilePasswordChangePayload,
  ProfileUpdatePayload as ProfileUpdateRequest,
  PasswordChangeResponse,
} from './profile.types';

// Lead types
export * from './lead.types';

// Common/shared types (to be implemented in future tasks)
// export * from './common';
// export * from './api';
// export * from './lead';
// export * from './quotation';
// export * from './commission';

// Currently no types to export - this file serves as a placeholder
// and will be populated as types are defined in subsequent tasks
// export * from './auth.types';
