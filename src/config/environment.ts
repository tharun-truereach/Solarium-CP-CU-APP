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
  environment: getEnvVar('REACT_APP_ENVIRONMENT', 'DEV') as
    | 'DEV'
    | 'STAGING'
    | 'PROD',

  // API Configuration
  apiBaseUrl: getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:3000'),
  apiTimeout: getEnvVar('REACT_APP_API_TIMEOUT', 30000, toNumber),

  // Session Configuration
  sessionTimeoutMinutes: getEnvVar(
    'REACT_APP_SESSION_TIMEOUT_MIN',
    30,
    toNumber
  ),
  sessionWarningMinutes: getEnvVar(
    'REACT_APP_SESSION_WARNING_MIN',
    5,
    toNumber
  ),
  cryptoSecret: getEnvVar(
    'VITE_CRYPTO_SECRET',
    'fallback-secret-key-for-development-only-32chars'
  ),

  // Feature Flags
  enableDebugTools: getEnvVar('REACT_APP_ENABLE_DEBUG_TOOLS', true, toBool),
  enableMockAuth: getEnvVar('REACT_APP_ENABLE_MOCK_AUTH', true, toBool),
  enableServiceWorker: getEnvVar(
    'REACT_APP_ENABLE_SERVICE_WORKER',
    false,
    toBool
  ),

  // External Services
  sentryDsn: getProcessEnv('REACT_APP_SENTRY_DSN') || undefined,
  analyticsId: getProcessEnv('REACT_APP_ANALYTICS_ID') || 'test-analytics-id',

  // Build Information
  buildNumber: getEnvVar('REACT_APP_BUILD_NUMBER', 'test-build'),
  version: getEnvVar('REACT_APP_VERSION', '1.0.0-test'),

  // Debug Settings
  logLevel: getEnvVar('REACT_APP_LOG_LEVEL', 'debug') as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error',
  showReduxDevtools: getEnvVar('REACT_APP_SHOW_REDUX_DEVTOOLS', true, toBool),
};

/**
 * Environment validation
 */
export const validateEnvironment = (): void => {
  const requiredVars = ['REACT_APP_ENVIRONMENT', 'REACT_APP_API_BASE_URL'];
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
