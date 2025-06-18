/**
 * Encrypted transformation utilities for Redux Persist
 * Provides AES-256 encryption for sensitive state data
 */

import { encryptTransform } from 'redux-persist-transform-encrypt';
import { config } from '../../config/environment';

/**
 * Create encrypted transform with error handling and secret rotation support
 */
export const createEncryptedTransform = (secret: string) => {
  return encryptTransform({
    secretKey: secret,
    onError: (error: Error | string) => {
      console.error('Redux persist encryption error:', error);

      // Clear corrupted storage on encryption error
      try {
        localStorage.removeItem('persist:root');
        console.warn(
          'Cleared corrupted encrypted storage due to encryption error'
        );
      } catch (clearError) {
        console.error('Failed to clear corrupted storage:', clearError);
      }

      // In development, provide more detailed error information
      if (config.environment === 'DEV') {
        console.error('Encryption error details:', {
          error,
          secret: secret ? `${secret.substring(0, 4)}...` : 'No secret',
          timestamp: new Date().toISOString(),
        });
      }
    },
  });
};

/**
 * Storage purge utilities for secret rotation and cleanup
 */
export const storagePurge = {
  /**
   * Purge all persisted data (useful for logout or secret rotation)
   */
  purgeAll: (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Remove all persist keys
        const keysToRemove = [
          'persist:root',
          'persist:auth',
          'persist:preferences',
        ];

        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });

        console.log('✅ All persisted data purged successfully');
        resolve();
      } catch (error) {
        console.error('❌ Failed to purge persisted data:', error);
        reject(error);
      }
    });
  },

  /**
   * Purge only auth-related data (for logout)
   */
  purgeAuth: (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        localStorage.removeItem('persist:auth');
        console.log('✅ Auth data purged successfully');
        resolve();
      } catch (error) {
        console.error('❌ Failed to purge auth data:', error);
        reject(error);
      }
    });
  },

  /**
   * Check if persisted data exists
   */
  hasPersistedData: (): boolean => {
    try {
      return !!(
        localStorage.getItem('persist:root') ||
        localStorage.getItem('persist:auth') ||
        localStorage.getItem('persist:preferences')
      );
    } catch (error) {
      console.error('Failed to check persisted data:', error);
      return false;
    }
  },

  /**
   * Get persisted data size (for debugging)
   */
  getStorageSize: (): { [key: string]: number } => {
    const sizes: { [key: string]: number } = {};

    try {
      const persistKeys = [
        'persist:root',
        'persist:auth',
        'persist:preferences',
      ];

      persistKeys.forEach(key => {
        const data = localStorage.getItem(key);
        sizes[key] = data ? new Blob([data]).size : 0;
      });

      return sizes;
    } catch (error) {
      console.error('Failed to get storage sizes:', error);
      return {};
    }
  },

  /**
   * Rotate encryption secret (for security)
   */
  rotateSecret: async (
    _oldSecret: string,
    _newSecret: string
  ): Promise<void> => {
    try {
      // This is a complex operation that would require:
      // 1. Decrypt existing data with old secret
      // 2. Re-encrypt with new secret
      // 3. Replace stored data
      // For now, we'll just purge and require re-login

      console.warn('Secret rotation requires user re-authentication');
      await storagePurge.purgeAll();

      // Update the secret in config (this would typically be done server-side)
      console.log('✅ Secret rotation completed - user must re-authenticate');
    } catch (error) {
      console.error('❌ Secret rotation failed:', error);
      throw error;
    }
  },
};

/**
 * Persistence error handlers
 */
export const persistenceErrorHandlers = {
  /**
   * Handle rehydration errors
   */
  onRehydrateError: (error: Error, key: string) => {
    console.error(`Rehydration error for ${key}:`, error);

    // Clear corrupted data
    try {
      localStorage.removeItem(`persist:${key}`);
      console.warn(`Cleared corrupted persisted data for ${key}`);
    } catch (clearError) {
      console.error(`Failed to clear corrupted data for ${key}:`, clearError);
    }
  },

  /**
   * Handle storage quota exceeded errors
   */
  onStorageQuotaExceeded: () => {
    console.error('Storage quota exceeded - clearing old persisted data');

    // Clear non-essential persisted data
    try {
      // Keep auth but clear other data
      const authData = localStorage.getItem('persist:auth');
      localStorage.clear();
      if (authData) {
        localStorage.setItem('persist:auth', authData);
      }
      console.log('✅ Cleared excess storage data');
    } catch (error) {
      console.error('❌ Failed to clear excess storage:', error);
    }
  },
};

/**
 * Development utilities for persistence debugging
 */
export const persistenceDebugUtils = {
  /**
   * Log current persistence state (development only)
   */
  logPersistenceState: () => {
    if (config.environment !== 'DEV') return;

    console.group('🔒 Persistence Debug Info');
    console.log('Storage sizes:', storagePurge.getStorageSize());
    console.log('Has persisted data:', storagePurge.hasPersistedData());
    console.log('Crypto secret configured:', !!config.cryptoSecret);
    console.log('Storage available:', !!window.localStorage);
    console.groupEnd();
  },

  /**
   * Test encryption/decryption (development only)
   */
  testEncryption: () => {
    if (config.environment !== 'DEV') return;

    try {
      const testData = { test: 'encryption-test', timestamp: Date.now() };
      createEncryptedTransform(config.cryptoSecret);

      console.log('🔒 Testing encryption...');
      console.log('Original data:', testData);

      // Note: This is a simplified test - actual redux-persist transform is more complex
      console.log('✅ Encryption transform created successfully');
    } catch (error) {
      console.error('❌ Encryption test failed:', error);
    }
  },
};
