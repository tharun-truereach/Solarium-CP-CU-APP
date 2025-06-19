/**
 * Enhanced encrypted transform for Redux persistence
 * Provides AES-256 encryption with checksum verification, key rotation, and tamper detection
 */

import { Transform } from 'redux-persist';
import CryptoJS from 'crypto-js';
import { config } from '../../config/environment';

/**
 * Encrypted data structure with versioning and integrity checks
 */
interface EncryptedPayload {
  version: number;
  keyId: string;
  checksum: string;
  timestamp: number;
  data: string;
}

/**
 * Key rotation configuration
 */
interface KeyRotationConfig {
  gracePeriodDays: number;
  rotationIntervalDays: number;
}

/**
 * Default key rotation settings
 */
const DEFAULT_KEY_ROTATION: KeyRotationConfig = {
  gracePeriodDays: 7,
  rotationIntervalDays: 90,
};

/**
 * Current encryption version
 */
const ENCRYPTION_VERSION = 2;

/**
 * Generate a deterministic key ID from the secret
 */
function generateKeyId(secret: string): string {
  return CryptoJS.SHA256(secret).toString().substring(0, 8);
}

/**
 * Calculate SHA-256 checksum of data
 */
function calculateChecksum(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Verify data integrity using checksum
 */
function verifyChecksum(data: string, expectedChecksum: string): boolean {
  const actualChecksum = calculateChecksum(data);
  return actualChecksum === expectedChecksum;
}

/**
 * Add checksum to state data
 */
export function addChecksum(state: any): any {
  if (!state || typeof state !== 'object') {
    return state;
  }

  const stateString = JSON.stringify(state);
  const checksum = calculateChecksum(stateString);

  return {
    ...state,
    _checksum: checksum,
    _timestamp: Date.now(),
  };
}

/**
 * Verify checksum of state data
 */
export function verifyChecksumState(state: any): boolean {
  if (!state || typeof state !== 'object' || !state._checksum) {
    return false;
  }

  const { _checksum, _timestamp, ...dataWithoutChecksum } = state;
  const dataString = JSON.stringify(dataWithoutChecksum);

  return verifyChecksum(dataString, _checksum);
}

/**
 * Enhanced encrypt transform with integrity checks and key rotation
 */
export function createEncryptedTransform(
  secretKey: string,
  keyRotationConfig: Partial<KeyRotationConfig> = {}
): Transform<any, any> {
  const rotationConfig = { ...DEFAULT_KEY_ROTATION, ...keyRotationConfig };

  // Validate secret key strength
  if (secretKey.length < 32) {
    console.error(
      '🚨 Encryption secret key is too weak! Use at least 32 characters.'
    );
    throw new Error('Encryption key must be at least 32 characters long');
  }

  const keyId = generateKeyId(secretKey);

  return {
    in: (state: any, key: string | number | symbol) => {
      try {
        if (!state) return state;

        // Add checksum to state before encryption
        const stateWithChecksum = addChecksum(state);
        const stateString = JSON.stringify(stateWithChecksum);

        // Calculate checksum of the serialized state
        const checksum = calculateChecksum(stateString);

        // Encrypt the state
        const encrypted = CryptoJS.AES.encrypt(
          stateString,
          secretKey
        ).toString();

        // Create encrypted payload with metadata
        const payload: EncryptedPayload = {
          version: ENCRYPTION_VERSION,
          keyId,
          checksum,
          timestamp: Date.now(),
          data: encrypted,
        };

        if (config.environment === 'DEV') {
          console.log(`🔐 Encrypting state for key: ${String(key)}`);
        }

        return JSON.stringify(payload);
      } catch (error) {
        console.error('🚨 Encryption failed:', error);
        // Return null to prevent storage of corrupted data
        return null;
      }
    },

    out: (state: string, key: string | number | symbol) => {
      try {
        if (!state || typeof state !== 'string') {
          return state;
        }

        let payload: EncryptedPayload;

        try {
          payload = JSON.parse(state);
        } catch (parseError) {
          console.error('🚨 Failed to parse encrypted payload:', parseError);
          return null;
        }

        // Validate payload structure
        if (!payload || typeof payload !== 'object' || !payload.data) {
          console.error('🚨 Invalid encrypted payload structure');
          return null;
        }

        // Check version compatibility
        if (payload.version > ENCRYPTION_VERSION) {
          console.error(
            '🚨 Encrypted data version is newer than supported version'
          );
          return null;
        }

        // Check key ID for rotation detection
        if (payload.keyId !== keyId) {
          console.warn('🔄 Key rotation detected, attempting to migrate data');

          // Check if we're within grace period
          const ageDays =
            (Date.now() - (payload.timestamp || 0)) / (1000 * 60 * 60 * 24);
          if (ageDays > rotationConfig.gracePeriodDays) {
            console.error(
              '🚨 Encrypted data is too old for current key, forcing logout'
            );
            // Trigger logout by returning null - this will be handled by the app
            persistenceErrorHandlers.onTamperDetected(
              'Key rotation grace period expired'
            );
            return null;
          }
        }

        // Decrypt the data
        let decryptedString: string;
        try {
          const decryptedBytes = CryptoJS.AES.decrypt(payload.data, secretKey);
          decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

          if (!decryptedString) {
            throw new Error('Decryption resulted in empty string');
          }
        } catch (decryptError) {
          console.error('🚨 Decryption failed:', decryptError);
          persistenceErrorHandlers.onTamperDetected('Decryption failed');
          return null;
        }

        // Verify checksum integrity
        if (!verifyChecksum(decryptedString, payload.checksum)) {
          console.error(
            '🚨 Checksum verification failed - data may have been tampered with'
          );
          persistenceErrorHandlers.onTamperDetected(
            'Checksum verification failed'
          );
          return null;
        }

        // Parse and verify the decrypted state
        let decryptedState: any;
        try {
          decryptedState = JSON.parse(decryptedString);
        } catch (parseError) {
          console.error('🚨 Failed to parse decrypted state:', parseError);
          return null;
        }

        // Verify internal checksum if present
        if (!verifyChecksumState(decryptedState)) {
          console.error('🚨 Internal state checksum verification failed');
          persistenceErrorHandlers.onTamperDetected(
            'Internal checksum verification failed'
          );
          return null;
        }

        // Remove internal checksum and timestamp from state
        const { _checksum, _timestamp, ...cleanState } = decryptedState;

        if (config.environment === 'DEV') {
          console.log(
            `🔓 Successfully decrypted state for key: ${String(key)}`
          );
        }

        return cleanState;
      } catch (error) {
        console.error('🚨 Decryption process failed:', error);
        persistenceErrorHandlers.onTamperDetected('Decryption process failed');
        return null;
      }
    },
  };
}

/**
 * Storage purge utilities
 */
export const storagePurge = {
  /**
   * Purge all persisted data
   */
  purgeAll: async (): Promise<void> => {
    try {
      const keys = Object.keys(localStorage);
      const persistKeys = keys.filter(key => key.startsWith('persist:'));

      persistKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`🧹 Purged ${persistKeys.length} persist keys from storage`);
    } catch (error) {
      console.error('🚨 Failed to purge storage:', error);
      throw error;
    }
  },

  /**
   * Purge only auth-related data
   */
  purgeAuth: async (): Promise<void> => {
    try {
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('persist:root');
      console.log('🧹 Purged auth data from storage');
    } catch (error) {
      console.error('🚨 Failed to purge auth storage:', error);
      throw error;
    }
  },

  /**
   * Check if persisted data exists
   */
  hasPersistedData: (): boolean => {
    try {
      const keys = Object.keys(localStorage);
      return keys.some(key => key.startsWith('persist:'));
    } catch (error) {
      console.error('🚨 Failed to check persisted data:', error);
      return false;
    }
  },

  /**
   * Get total storage size
   */
  getStorageSize: (): number => {
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      return totalSize;
    } catch (error) {
      console.error('🚨 Failed to calculate storage size:', error);
      return 0;
    }
  },

  /**
   * Rotate encryption secret
   */
  rotateSecret: async (oldSecret: string, newSecret: string): Promise<void> => {
    try {
      console.log('🔄 Starting secret rotation...');

      // Get all persist keys
      const keys = Object.keys(localStorage);
      const persistKeys = keys.filter(key => key.startsWith('persist:'));

      // Decrypt with old secret and re-encrypt with new secret
      const oldTransform = createEncryptedTransform(oldSecret);
      const newTransform = createEncryptedTransform(newSecret);

      for (const key of persistKeys) {
        const encryptedData = localStorage.getItem(key);
        if (encryptedData) {
          // Decrypt with old secret
          const decryptedData = oldTransform.out(encryptedData, key, {});
          if (decryptedData !== null) {
            // Re-encrypt with new secret
            const reEncryptedData = newTransform.in(decryptedData, key, {});
            if (reEncryptedData !== null) {
              localStorage.setItem(key, reEncryptedData);
            }
          }
        }
      }

      console.log('✅ Secret rotation completed');
    } catch (error) {
      console.error('🚨 Secret rotation failed:', error);
      throw error;
    }
  },
};

/**
 * Persistence error handlers
 */
export const persistenceErrorHandlers = {
  /**
   * Handle storage quota exceeded
   */
  onStorageQuotaExceeded: (): void => {
    console.error('🚨 Storage quota exceeded');

    // Clear old data to make space
    try {
      const keys = Object.keys(localStorage);
      const persistKeys = keys.filter(key => key.startsWith('persist:'));

      // Remove oldest entries first
      persistKeys.sort((a, b) => {
        const aData = localStorage.getItem(a);
        const bData = localStorage.getItem(b);

        try {
          const aPayload = JSON.parse(aData || '{}');
          const bPayload = JSON.parse(bData || '{}');
          return (aPayload.timestamp || 0) - (bPayload.timestamp || 0);
        } catch {
          return 0;
        }
      });

      // Remove oldest 25% of entries
      const toRemove = Math.ceil(persistKeys.length * 0.25);
      for (let i = 0; i < toRemove && i < persistKeys.length; i++) {
        const key = persistKeys[i];
        if (key) {
          localStorage.removeItem(key);
        }
      }

      console.log(`🧹 Removed ${toRemove} old entries to free storage space`);
    } catch (error) {
      console.error('🚨 Failed to handle storage quota exceeded:', error);
    }
  },

  /**
   * Handle tamper detection
   */
  onTamperDetected: (reason: string): void => {
    console.error(`🚨 Tamper detected: ${reason}`);

    // Clear all persisted data
    storagePurge.purgeAll().catch(console.error);

    // Dispatch custom event for app to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('persistence:tamper-detected', {
          detail: { reason, timestamp: Date.now() },
        })
      );
    }

    // Force logout by redirecting to login
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=security';
      }
    }, 100);
  },
};

/**
 * Persistence debug utilities
 */
export const persistenceDebugUtils = {
  /**
   * Log persistence state
   */
  logPersistenceState: (): void => {
    if (config.environment !== 'DEV') return;

    console.group('🔍 Persistence State');
    console.log('Has persisted data:', storagePurge.hasPersistedData());
    console.log('Storage size (bytes):', storagePurge.getStorageSize());
    console.log(
      'Persist keys:',
      Object.keys(localStorage).filter(k => k.startsWith('persist:'))
    );
    console.groupEnd();
  },

  /**
   * Test encryption functionality
   */
  testEncryption: (): void => {
    if (config.environment !== 'DEV') return;

    try {
      const testData = { test: 'encryption-test', timestamp: Date.now() };
      const transform = createEncryptedTransform(config.cryptoSecret);

      // Test encryption
      const encrypted = transform.in(testData, 'test', {});
      if (!encrypted) {
        throw new Error('Encryption returned null');
      }

      // Test decryption
      const decrypted = transform.out(encrypted, 'test', {});
      if (!decrypted || decrypted.test !== testData.test) {
        throw new Error('Decryption failed or data mismatch');
      }

      console.log('✅ Encryption test passed');
    } catch (error) {
      console.error('🚨 Encryption test failed:', error);
    }
  },

  /**
   * Test tamper detection
   */
  testTamperDetection: (): void => {
    if (config.environment !== 'DEV') return;

    try {
      const testData = { test: 'tamper-test', timestamp: Date.now() };
      const transform = createEncryptedTransform(config.cryptoSecret);

      // Encrypt data
      const encrypted = transform.in(testData, 'test', {});
      if (!encrypted) return;

      // Tamper with encrypted data
      const payload = JSON.parse(encrypted);
      payload.checksum = 'tampered-checksum';
      const tamperedEncrypted = JSON.stringify(payload);

      // Try to decrypt tampered data
      const result = transform.out(tamperedEncrypted, 'test', {});

      if (result === null) {
        console.log('✅ Tamper detection test passed - tampered data rejected');
      } else {
        console.error(
          '🚨 Tamper detection test failed - tampered data accepted'
        );
      }
    } catch (error) {
      console.error('🚨 Tamper detection test error:', error);
    }
  },
};

// Set up tamper detection event listener
if (typeof window !== 'undefined') {
  window.addEventListener('persistence:tamper-detected', (event: any) => {
    console.error('🚨 Security Alert: Data tampering detected', event.detail);

    // Additional security measures can be added here
    // such as reporting to security service
  });
}

export default createEncryptedTransform;
