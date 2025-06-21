/**
 * Security utilities for access control and logging
 * Centralizes security-related functions and logging
 */

/**
 * Interface for access denial logging
 */
export interface AccessDeniedLog {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  requestedPath: string;
  reason: string;
  userTerritories?: string[];
  requiredRoles?: string[];
  requiredTerritories?: string[];
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Log access denial attempts for security monitoring
 * Centralized function for consistent security logging
 *
 * @param detail - Access denial details
 */
export const logAccessDenied = (detail: AccessDeniedLog): void => {
  // Enhanced logging with additional context
  const enhancedDetail = {
    ...detail,
    userAgent:
      typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    // Note: IP address would typically be logged server-side
    timestamp: detail.timestamp || new Date().toISOString(),
  };

  // Console warning for development and debugging
  console.warn(
    `Access denied for user ${detail.userEmail || 'unknown'} to ${detail.requestedPath}`,
    enhancedDetail
  );

  // In production, this could also send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to security monitoring service
    // securityMonitoringService.logAccessDenial(enhancedDetail);
  }

  // Dispatch custom event for global error handling
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('security:access-denied', {
        detail: enhancedDetail,
      })
    );
  }
};

/**
 * Log successful access for audit trail
 *
 * @param detail - Access success details
 */
export const logAccessGranted = (detail: {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  accessedPath: string;
  timestamp?: string;
}): void => {
  const enhancedDetail = {
    ...detail,
    timestamp: detail.timestamp || new Date().toISOString(),
  };

  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `Access granted for user ${detail.userEmail || 'unknown'} to ${detail.accessedPath}`,
      enhancedDetail
    );
  }

  // Dispatch custom event for analytics
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('security:access-granted', {
        detail: enhancedDetail,
      })
    );
  }
};

/**
 * Validate user permissions for specific actions
 *
 * @param userRole - User's role
 * @param requiredRoles - Required roles for the action
 * @param userPermissions - User's specific permissions
 * @param requiredPermissions - Required permissions for the action
 * @returns True if user has required access
 */
export const validateUserAccess = ({
  userRole,
  requiredRoles = [],
  userPermissions = [],
  requiredPermissions = [],
}: {
  userRole?: string;
  requiredRoles?: string[];
  userPermissions?: string[];
  requiredPermissions?: string[];
}): boolean => {
  // Check role-based access
  const hasRoleAccess =
    requiredRoles.length === 0 ||
    (userRole && requiredRoles.includes(userRole));

  // Check permission-based access
  const hasPermissionAccess =
    requiredPermissions.length === 0 ||
    requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

  return Boolean(hasRoleAccess) && Boolean(hasPermissionAccess);
};

/**
 * Generate correlation ID for request tracking
 *
 * @returns Unique correlation ID
 */
export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Security event types for monitoring
 */
export const SECURITY_EVENTS = {
  ACCESS_DENIED: 'security:access-denied',
  ACCESS_GRANTED: 'security:access-granted',
  AUTHENTICATION_FAILED: 'security:auth-failed',
  AUTHENTICATION_SUCCESS: 'security:auth-success',
  SESSION_EXPIRED: 'security:session-expired',
  SUSPICIOUS_ACTIVITY: 'security:suspicious-activity',
} as const;

export type SecurityEvent =
  (typeof SECURITY_EVENTS)[keyof typeof SECURITY_EVENTS];
