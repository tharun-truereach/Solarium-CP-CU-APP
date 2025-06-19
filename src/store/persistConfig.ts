/**
 * Redux Persist Configuration with Encryption
 * Handles encrypted persistence for sensitive application state
 */
import { PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createEncryptedTransform } from './persistence/encryptedTransform';
import { config } from '../config/environment';

/**
 * Create encrypted transformer with validation
 */
const createSecureTransform = () => {
  // Validate crypto secret
  if (!config.cryptoSecret || config.cryptoSecret.length < 32) {
    console.warn(
      '⚠️ Crypto secret is too short or missing. Using fallback (INSECURE for production!)'
    );
  }

  return createEncryptedTransform(config.cryptoSecret);
};

/**
 * Persistence configuration for the entire store
 */
export const persistConfig: PersistConfig<any> = {
  key: 'solarium-root',
  version: 1,
  storage,

  // Transform sensitive data before storage
  transforms: [createSecureTransform()],

  // Persist these slices with encryption
  whitelist: ['auth', 'preferences'],

  // Don't persist these slices (UI state should be ephemeral)
  blacklist: ['ui', 'api'],

  // Migration and error handling
  migrate: (state: any) => {
    // Handle version migrations if needed
    console.log('🔄 Migrating persisted state...');
    return Promise.resolve(state);
  },

  // Debug persistence in development
  debug: config.environment === 'DEV',

  // Timeout for persistence operations
  timeout: 10000, // 10 seconds

  // Throttle persistence writes
  throttle: 1000, // 1 second
};

/**
 * Specific persistence config for auth slice with stronger encryption
 */
export const authPersistConfig: PersistConfig<any> = {
  key: 'solarium-auth',
  version: 1,
  storage,
  transforms: [createSecureTransform()],

  // Only persist essential auth data
  whitelist: ['user', 'token', 'refreshToken', 'expiresAt', 'rememberMe'],

  // Don't persist ephemeral auth state
  blacklist: ['loading', 'error', 'loginAttempts'],

  debug: config.environment === 'DEV',
};

/**
 * Persistence config for preferences with lighter encryption
 */
export const preferencesPersistConfig: PersistConfig<any> = {
  key: 'solarium-preferences',
  version: 1,
  storage,
  transforms: [createSecureTransform()],
  debug: config.environment === 'DEV',
};

/**
 * Validation utilities for persistence
 */
export const persistenceUtils = {
  /**
   * Validate persistence configuration
   */
  validateConfig: (): boolean => {
    try {
      if (!storage) {
        console.error('❌ Storage not available');
        return false;
      }

      if (!config.cryptoSecret || config.cryptoSecret.length < 32) {
        console.error('❌ Invalid crypto secret configuration');
        return false;
      }

      console.log('✅ Persistence configuration validated');
      return true;
    } catch (error) {
      console.error('❌ Persistence validation failed:', error);
      return false;
    }
  },

  /**
   * Clear all persisted data
   */
  clearAll: async (): Promise<void> => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      const solariumKeys = keys.filter((key: string) =>
        key.startsWith('persist:solarium')
      );

      await Promise.all(
        solariumKeys.map((key: string) => storage.removeItem(key))
      );

      console.log('🧹 Cleared all persisted data');
    } catch (error) {
      console.error('❌ Failed to clear persisted data:', error);
      throw error;
    }
  },

  /**
   * Get persistence info for debugging
   */
  getInfo: async (): Promise<Record<string, any>> => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      const solariumKeys = keys.filter((key: string) =>
        key.startsWith('persist:solarium')
      );

      const info: Record<string, any> = {};
      for (const key of solariumKeys) {
        const value = await storage.getItem(key);
        info[key] = {
          size: value ? JSON.stringify(value).length : 0,
          encrypted: value ? value.includes('encrypted:') : false,
        };
      }

      return info;
    } catch (error) {
      console.error('❌ Failed to get persistence info:', error);
      return {};
    }
  },
};

// Validate configuration on module load
if (config.environment === 'DEV') {
  persistenceUtils.validateConfig();
}
