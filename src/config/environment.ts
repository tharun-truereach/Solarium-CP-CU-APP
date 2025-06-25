/**
 * Environment configuration module
 * Centralizes access to environment variables with type safety and validation
 */

export interface EnvironmentConfig {
  // Environment
  environment: 'DEV' | 'STAGING' | 'PROD';

  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;

  // Session Configuration
  sessionTimeoutMinutes: number;
  sessionWarningMinutes: number;
  cryptoSecret: string;

  // Feature Flags
  enableDebugTools: boolean;
  enableMockAuth: boolean;
  enableServiceWorker: boolean;

  // External Services
  sentryDsn: string | undefined;
  analyticsId: string | undefined;

  // Build Information
  buildNumber: string;
  version: string;

  // Debug Settings
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  showReduxDevtools: boolean;

  // Notification Configuration
  notificationPollInterval: number;
}

/**
 * Safe access to process.env with fallback
 */
const getProcessEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

/**
 * Get environment variable with type conversion and validation
 */
function getEnvVar<T = string>(
  key: string,
  defaultValue?: T,
  converter?: (value: string) => T
): T {
  const value = getProcessEnv(key);

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }

  if (converter) {
    try {
      return converter(value);
    } catch (error) {
      throw new Error(
        `Failed to convert environment variable ${key}: ${error}`
      );
    }
  }

  return value as T;
}

/**
 * Convert string to boolean
 */
const toBool = (value: string): boolean => {
  return value.toLowerCase() === 'true';
};

/**
 * Convert string to number
 */
const toNumber = (value: string): number => {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return num;
};

/**
 * Environment configuration instance
 */
export const config: EnvironmentConfig = {
  // Environment
  environment: getEnvVar('VITE_ENVIRONMENT', 'DEV') as
    | 'DEV'
    | 'STAGING'
    | 'PROD',

  // API Configuration - Updated to use /api/v1 path
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000/api/v1'),
  apiTimeout: getEnvVar('VITE_API_TIMEOUT', 30000, toNumber),

  // Session Configuration
  sessionTimeoutMinutes: getEnvVar('VITE_SESSION_TIMEOUT_MIN', 30, toNumber),
  sessionWarningMinutes: getEnvVar('VITE_SESSION_WARNING_MIN', 5, toNumber),
  cryptoSecret: getEnvVar(
    'VITE_CRYPTO_SECRET',
    'fallback-secret-key-for-development-only-32chars'
  ),

  // Feature Flags
  enableDebugTools: getEnvVar('VITE_ENABLE_DEBUG_TOOLS', true, toBool),
  enableMockAuth: getEnvVar('VITE_ENABLE_MOCK_AUTH', true, toBool),
  enableServiceWorker: getEnvVar('VITE_ENABLE_SERVICE_WORKER', false, toBool),

  // External Services
  sentryDsn: getProcessEnv('VITE_SENTRY_DSN') || undefined,
  analyticsId: getProcessEnv('VITE_ANALYTICS_ID') || 'test-analytics-id',

  // Build Information
  buildNumber: getEnvVar('VITE_BUILD_NUMBER', 'test-build'),
  version: getEnvVar('VITE_VERSION', '1.0.0-test'),

  // Debug Settings
  logLevel: getEnvVar('VITE_LOG_LEVEL', 'debug') as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error',
  showReduxDevtools: getEnvVar('VITE_SHOW_REDUX_DEVTOOLS', true, toBool),

  // Notification polling configuration
  notificationPollInterval: getEnvVar(
    'VITE_NOTIFICATION_POLL_MS',
    30000,
    toNumber
  ),
};

/**
 * Environment validation
 */
export const validateEnvironment = (): void => {
  const requiredVars = ['VITE_ENVIRONMENT', 'VITE_API_BASE_URL'];
  const missing = requiredVars.filter(key => !getProcessEnv(key));

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Validate session timeout configuration
  if (config.sessionWarningMinutes >= config.sessionTimeoutMinutes) {
    throw new Error(
      'Session warning time must be less than session timeout time'
    );
  }

  // Validate API URL format
  try {
    new URL(config.apiBaseUrl);
  } catch {
    throw new Error(`Invalid API base URL: ${config.apiBaseUrl}`);
  }

  // Validate crypto secret length for security
  if (config.cryptoSecret.length < 32) {
    console.warn(
      '⚠️ VITE_CRYPTO_SECRET should be at least 32 characters for optimal security'
    );
  }
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return config.environment === 'DEV';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return config.environment === 'PROD';
};

/**
 * Check if running in staging mode
 */
export const isStaging = (): boolean => {
  return config.environment === 'STAGING';
};

/**
 * Get display name for current environment
 */
export const getEnvironmentDisplayName = (): string => {
  switch (config.environment) {
    case 'DEV':
      return 'Development';
    case 'STAGING':
      return 'Staging';
    case 'PROD':
      return 'Production';
    default:
      return 'Unknown';
  }
};

// Validate environment on module load (wrapped in try-catch)
try {
  validateEnvironment();
} catch (error) {
  console.warn('Environment validation failed:', error);
}
