/**
 * Application constants for Solarium Web Portal
 * Centralized constants used throughout the application
 */
import { config } from '../config/environment';

// Application metadata
export const APP_CONFIG = {
  NAME: 'Solarium Web Portal',
  VERSION: config.version,
  ENVIRONMENT: config.environment,
  SESSION_TIMEOUT: config.sessionTimeoutMinutes * 60 * 1000, // Convert to milliseconds
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: config.apiBaseUrl,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_LEAD: 7,
  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  ALLOWED_EXTENSIONS: ['pdf', 'jpg', 'jpeg', 'png'],
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// Lead management constants
export const LEAD_CONFIG = {
  STATUSES: {
    NEW_LEAD: 'New Lead',
    IN_DISCUSSION: 'In Discussion',
    PHYSICAL_MEETING_ASSIGNED: 'Physical Meeting Assigned',
    CUSTOMER_ACCEPTED: 'Customer Accepted',
    WON: 'Won',
    PENDING_AT_SOLARIUM: 'Pending at Solarium',
    UNDER_EXECUTION: 'Under Execution',
    EXECUTED: 'Executed',
    NOT_RESPONDING: 'Not Responding',
    NOT_INTERESTED: 'Not Interested',
    OTHER_TERRITORY: 'Other Territory',
  },
  ORIGINS: {
    CP: 'CP',
    CUSTOMER: 'Customer',
    ADMIN: 'Admin',
    KAM: 'KAM',
  },
  FOLLOW_UP_MAX_DAYS: 30,
  REMARK_MIN_LENGTH: 10,
  BULK_SELECT_MAX: 50,
  EXPORT_FILENAME_PREFIX: 'leads-export',
  EXPORT_MAX_TIMEOUT: 30000, // 30 seconds
} as const;

// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  KAM: 'kam',
  CP: 'cp',
  CUSTOMER: 'customer',
} as const;

// UI Constants
export const UI_CONFIG = {
  DRAWER_WIDTH: 280,
  COLLAPSED_DRAWER_WIDTH: 64,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1200,
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]{10,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  NUMERIC: /^\d+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  INDIAN_PHONE: /^(\+91|91|0)?[6789]\d{9}$/,
} as const;

// Commission configuration
export const COMMISSION_CONFIG = {
  STATUSES: {
    PENDING: 'pending',
    APPROVED: 'approved',
    PAID: 'paid',
    REJECTED: 'rejected',
  },
  PAYMENT_METHODS: {
    BANK_TRANSFER: 'bank_transfer',
    CASH: 'cash',
    CHECK: 'check',
    DIGITAL_WALLET: 'digital_wallet',
  },
} as const;

// Quotation configuration
export const QUOTATION_CONFIG = {
  STATUSES: {
    DRAFT: 'draft',
    SHARED: 'shared',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
  },
  VALIDITY_DAYS: 30,
  MAX_REVISION_COUNT: 5,
} as const;

// Date and time formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss',
  RELATIVE_TIME_THRESHOLD: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  FILE_TOO_LARGE: `File size must be less than ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB.`,
  INVALID_FILE_TYPE: `Only ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')} files are allowed.`,
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in.',
  LOGOUT_SUCCESS: 'Successfully logged out.',
  SAVE_SUCCESS: 'Changes saved successfully.',
  DELETE_SUCCESS: 'Item deleted successfully.',
  UPDATE_SUCCESS: 'Item updated successfully.',
  CREATE_SUCCESS: 'Item created successfully.',
  UPLOAD_SUCCESS: 'File uploaded successfully.',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'solarium_token',
  USER_DATA: 'solarium_user',
  PREFERENCES: 'solarium_preferences',
  SIDEBAR_STATE: 'solarium_sidebar_state',
  THEME_MODE: 'solarium_theme_mode',
} as const;

// Analytics events (if analytics is enabled)
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  QUOTATION_GENERATED: 'quotation_generated',
  COMMISSION_PROCESSED: 'commission_processed',
  ERROR_OCCURRED: 'error_occurred',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ANALYTICS: !!config.analyticsId,
  DEBUG_MODE: config.enableDebugTools,
  OFFLINE_SUPPORT: false, // Future feature
  ADVANCED_REPORTING: false, // Future feature
  BULK_OPERATIONS: true,
} as const;

// Territory list (could be moved to API in future)
export const TERRITORIES = [
  'North',
  'South',
  'East',
  'West',
  'Central',
  'Northeast',
  'Northwest',
  'Southeast',
  'Southwest',
] as const;

export type Territory = (typeof TERRITORIES)[number];
