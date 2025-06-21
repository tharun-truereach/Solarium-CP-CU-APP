/**
 * Enhanced Encrypted Transform with SHA-256 Checksum and Tamper Detection
 * Provides AES-256 encryption with integrity verification for Redux persistence
 */
import { Transform } from 'redux-persist';
import CryptoJS from 'crypto-js';
import { config } from '../../config/environment';

/**
 * Encrypted state wrapper with integrity data
 */
interface EncryptedStateWrapper {
  version: string;
  keyId: string;
  timestamp: number;
  checksum: string;
  data: string;
  iv: string;
}

/**
 * Persistence error handlers for security events
 */
export const persistenceErrorHandlers = {
  /**
   * Called when tamper detection is triggered
   */
  onTamperDetected: (reason: string) => {
    console.error('🚨 Storage tamper detected:', reason);

    // In production, you might want to:
    // - Log to security monitoring system
    // - Force user logout
    // - Send alert to admin dashboard

    if (typeof window !== 'undefined') {
      // Dispatch custom event for global handling
      window.dispatchEvent(
        new CustomEvent('storage:tamper-detected', {
          detail: { reason, timestamp: new Date().toISOString() },
        })
      );

      // Clear potentially compromised storage
      try {
        localStorage.removeItem('persist:solarium-auth');
        localStorage.removeItem('persist:solarium-root');
        sessionStorage.clear();

        // Force page reload to clear any compromised state
        setTimeout(() => {
          window.location.href = '/session-expired?reason=tamper';
        }, 100);
      } catch (error) {
        console.error('Failed to clear compromised storage:', error);
      }
    }
  },

  /**
   * Called when storage quota is exceeded
   */
  onStorageQuotaExceeded: () => {
    console.warn('⚠️ Storage quota exceeded, cleaning up old data');

    try {
      // Clean up non-essential stored data
      const keysToClean = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('persist:solarium')) {
          keysToClean.push(key);
        }
      }

      keysToClean.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error);
        }
      });
    } catch (error) {
      console.error('Storage cleanup failed:', error);
    }
  },

  /**
   * Called when decryption fails
   */
  onDecryptionFailure: (error: string) => {
    console.error('🔐 Decryption failed:', error);

    // This could indicate:
    // - Key rotation without proper migration
    // - Storage corruption
    // - Tampering attempt

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('storage:decryption-failed', {
          detail: { error, timestamp: new Date().toISOString() },
        })
      );
    }
  },
};

/**
 * Generate SHA-256 checksum for data integrity verification
 */
const generateChecksum = (
  data: string,
  keyId: string,
  timestamp: number
): string => {
  const checksumData = `${data}:${keyId}:${timestamp}:${config.cryptoSecret}`;
  return CryptoJS.SHA256(checksumData).toString();
};

/**
 * Verify data integrity using SHA-256 checksum
 */
const verifyChecksum = (
  data: string,
  keyId: string,
  timestamp: number,
  expectedChecksum: string
): boolean => {
  const actualChecksum = generateChecksum(data, keyId, timestamp);
  return actualChecksum === expectedChecksum;
};

/**
 * Generate cryptographically secure key ID
 */
const generateKeyId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
};

/**
 * Get current crypto key with rotation support
 */
const getCryptoKey = (): string => {
  if (!config.cryptoSecret || config.cryptoSecret.length < 32) {
    throw new Error(
      'CRYPTO_SECRET must be at least 32 characters for security'
    );
  }
  return config.cryptoSecret;
};

/**
 * Validate encrypted state wrapper structure
 */
const validateStateWrapper = (
  wrapper: any
): wrapper is EncryptedStateWrapper => {
  return (
    wrapper &&
    typeof wrapper === 'object' &&
    typeof wrapper.version === 'string' &&
    typeof wrapper.keyId === 'string' &&
    typeof wrapper.timestamp === 'number' &&
    typeof wrapper.checksum === 'string' &&
    typeof wrapper.data === 'string' &&
    typeof wrapper.iv === 'string'
  );
};

/**
 * Check if encrypted data is from an old version that needs migration
 */
const isLegacyFormat = (state: any): boolean => {
  // Check if it's the old format without integrity features
  return (
    typeof state === 'string' ||
    (typeof state === 'object' && !state.version && !state.checksum)
  );
};

/**
 * Migrate legacy encrypted data to new format with integrity checks
 */
const migrateLegacyData = (legacyState: any): any => {
  console.warn(
    '🔄 Migrating legacy encrypted data to new format with integrity checks'
  );

  try {
    // If it's an old encrypted string, try to decrypt it
    if (typeof legacyState === 'string') {
      const decrypted = CryptoJS.AES.decrypt(
        legacyState,
        getCryptoKey()
      ).toString(CryptoJS.enc.Utf8);
      if (decrypted) {
        return JSON.parse(decrypted);
      }
    }

    // If it's an old object format, return as-is
    if (typeof legacyState === 'object' && legacyState !== null) {
      return legacyState;
    }
  } catch (error) {
    console.error('❌ Legacy data migration failed:', error);
    persistenceErrorHandlers.onDecryptionFailure(
      `Legacy migration failed: ${error}`
    );
  }

  // Return undefined to trigger fresh state
  return undefined;
};

/**
 * Enhanced encrypted transform with integrity verification
 * Provides AES-256 encryption with SHA-256 checksums and tamper detection
 */
export const createEncryptedTransform = (
  secretKey?: string
): Transform<any, any, any, any> => {
  const cryptoKey = secretKey || getCryptoKey();

  return {
    in: (inboundState: any, key: string | number | symbol): string => {
      try {
        if (inboundState === undefined || inboundState === null) {
          return JSON.stringify(null);
        }

        // Generate encryption metadata
        const timestamp = Date.now();
        const keyId = generateKeyId();
        const iv = CryptoJS.lib.WordArray.random(128 / 8);

        // Serialize and encrypt the state
        const serializedState = JSON.stringify(inboundState);
        const encrypted = CryptoJS.AES.encrypt(serializedState, cryptoKey, {
          iv,
        }).toString();

        // Generate integrity checksum
        const checksum = generateChecksum(encrypted, keyId, timestamp);

        // Create wrapped encrypted state with integrity data
        const wrappedState: EncryptedStateWrapper = {
          version: '2.0',
          keyId,
          timestamp,
          checksum,
          data: encrypted,
          iv: iv.toString(),
        };

        const result = JSON.stringify(wrappedState);

        // Validate the result can be parsed back
        try {
          JSON.parse(result);
        } catch (parseError) {
          throw new Error(`Encryption result validation failed: ${parseError}`);
        }

        return result;
      } catch (error) {
        console.error('🔐 Encryption failed for key:', String(key), error);
        throw new Error(`Encryption failed: ${error}`);
      }
    },

    out: (outboundState: string, key: string | number | symbol): any => {
      try {
        if (!outboundState || outboundState === 'undefined') {
          return undefined;
        }

        // Parse the stored state
        let parsedState: any;
        try {
          parsedState = JSON.parse(outboundState);
        } catch (parseError) {
          console.error('❌ Failed to parse stored state:', parseError);
          persistenceErrorHandlers.onDecryptionFailure(
            `Parse error: ${parseError}`
          );
          return undefined;
        }

        // Handle null values
        if (parsedState === null) {
          return null;
        }

        // Handle legacy format migration
        if (isLegacyFormat(parsedState)) {
          console.warn('🔄 Detected legacy format, attempting migration');
          return migrateLegacyData(parsedState);
        }

        // Validate new format structure
        if (!validateStateWrapper(parsedState)) {
          console.error('❌ Invalid encrypted state structure');
          persistenceErrorHandlers.onTamperDetected(
            'Invalid state wrapper structure'
          );
          return undefined;
        }

        const wrapper = parsedState as EncryptedStateWrapper;

        // Verify integrity checksum
        const isChecksumValid = verifyChecksum(
          wrapper.data,
          wrapper.keyId,
          wrapper.timestamp,
          wrapper.checksum
        );

        if (!isChecksumValid) {
          console.error(
            '❌ Checksum verification failed - data may be tampered'
          );
          persistenceErrorHandlers.onTamperDetected(
            'Checksum verification failed'
          );
          return undefined;
        }

        // Check for suspicious timestamp (too old or future)
        const now = Date.now();
        const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
        const maxFuture = 60 * 1000; // 1 minute

        if (
          wrapper.timestamp < now - maxAge ||
          wrapper.timestamp > now + maxFuture
        ) {
          console.warn(
            '⚠️ Suspicious timestamp detected:',
            new Date(wrapper.timestamp)
          );
          persistenceErrorHandlers.onTamperDetected('Suspicious timestamp');
          return undefined;
        }

        // Decrypt the data
        let decrypted: string;
        try {
          const iv = CryptoJS.enc.Hex.parse(wrapper.iv);
          const decryptedWordArray = CryptoJS.AES.decrypt(
            wrapper.data,
            cryptoKey,
            { iv }
          );
          decrypted = decryptedWordArray.toString(CryptoJS.enc.Utf8);

          if (!decrypted) {
            throw new Error('Decryption resulted in empty string');
          }
        } catch (decryptError) {
          console.error('❌ Decryption failed:', decryptError);
          persistenceErrorHandlers.onDecryptionFailure(
            `Decryption error: ${decryptError}`
          );
          return undefined;
        }

        // Parse decrypted state
        let finalState: any;
        try {
          finalState = JSON.parse(decrypted);
        } catch (jsonError) {
          console.error('❌ Failed to parse decrypted state:', jsonError);
          persistenceErrorHandlers.onDecryptionFailure(
            `JSON parse error: ${jsonError}`
          );
          return undefined;
        }

        // Additional security validation for auth state
        if (String(key) === 'auth' && finalState) {
          // Validate JWT token structure if present
          if (finalState.token && typeof finalState.token === 'string') {
            const tokenParts = finalState.token.split('.');
            if (tokenParts.length !== 3) {
              console.error('❌ Invalid JWT token structure in stored state');
              persistenceErrorHandlers.onTamperDetected(
                'Invalid JWT structure'
              );
              return undefined;
            }
          }

          // Validate user object structure if present
          if (finalState.user && typeof finalState.user === 'object') {
            const requiredFields = ['id', 'email', 'role'];
            const missingFields = requiredFields.filter(
              field => !finalState.user[field]
            );
            if (missingFields.length > 0) {
              console.error('❌ Invalid user object structure:', missingFields);
              persistenceErrorHandlers.onTamperDetected('Invalid user object');
              return undefined;
            }
          }
        }

        return finalState;
      } catch (error) {
        console.error('🔐 Decryption failed for key:', String(key), error);
        persistenceErrorHandlers.onDecryptionFailure(`General error: ${error}`);
        return undefined;
      }
    },
  };
};

/**
 * Utility functions for encryption management
 */
export const encryptionUtils = {
  /**
   * Test if current encryption is working correctly
   */
  testEncryption: (): boolean => {
    try {
      const transform = createEncryptedTransform();
      const testData = { test: 'encryption-test', timestamp: Date.now() };

      const encrypted = transform.in(testData, 'test', {});
      const decrypted = transform.out(encrypted, 'test', {});

      return (
        decrypted &&
        decrypted.test === testData.test &&
        decrypted.timestamp === testData.timestamp
      );
    } catch (error) {
      console.error('❌ Encryption test failed:', error);
      return false;
    }
  },

  /**
   * Get encryption metadata from stored state
   */
  getEncryptionInfo: (
    encryptedData: string
  ): Partial<EncryptedStateWrapper> | null => {
    try {
      const parsed = JSON.parse(encryptedData);
      if (validateStateWrapper(parsed)) {
        return {
          version: parsed.version,
          keyId: parsed.keyId,
          timestamp: parsed.timestamp,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Check if stored data needs migration
   */
  needsMigration: (encryptedData: string): boolean => {
    try {
      const parsed = JSON.parse(encryptedData);
      return isLegacyFormat(parsed);
    } catch (error) {
      return true; // If we can't parse it, it probably needs migration
    }
  },

  /**
   * Clear all encrypted storage (emergency function)
   */
  clearAllEncryptedStorage: (): void => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('persist:solarium')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🧹 Cleared all encrypted storage');
    } catch (error) {
      console.error('❌ Failed to clear encrypted storage:', error);
    }
  },
};

// Export default transform factory
export default createEncryptedTransform;
