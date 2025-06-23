/**
 * Settings type definitions for system configuration management
 * Defines interfaces for system settings, feature flags, and audit logging
 */

/**
 * Feature flags configuration
 */
export interface FeatureFlags {
  [key: string]: boolean;
}

/**
 * System thresholds configuration
 */
export interface SystemThresholds {
  [key: string]: number;
}

/**
 * Main system settings interface
 */
export interface SystemSettings {
  // Authentication settings
  sessionTimeoutMin: number;
  tokenExpiryMin: number;

  // Feature toggles
  featureFlags: FeatureFlags;

  // Numeric thresholds
  thresholds: SystemThresholds;

  // Metadata
  lastUpdated?: string;
  updatedBy?: string;
}

/**
 * Settings update payload (partial updates allowed)
 */
export interface SettingsUpdatePayload extends Partial<SystemSettings> {
  // All fields are optional for partial updates
}

/**
 * Audit log entry for settings changes
 */
export interface SettingsAuditLog {
  id: string;
  userId: string;
  userName: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit log query parameters
 */
export interface AuditQuery {
  page?: number;
  limit?: number;
  field?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Audit log response with pagination
 */
export interface AuditLogResponse {
  logs: SettingsAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Settings API error response
 */
export interface SettingsApiError {
  status: number;
  message: string;
  field?: string;
  validationErrors?: Record<string, string[]>;
}
