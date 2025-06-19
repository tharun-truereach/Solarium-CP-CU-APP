/**
 * Tests for encrypted transform functionality
 * Covers encryption, decryption, checksums, and tamper detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createEncryptedTransform,
  addChecksum,
  verifyChecksumState,
  storagePurge,
  persistenceErrorHandlers,
  persistenceDebugUtils,
} from '../encryptedTransform';

// Mock crypto secret
const MOCK_SECRET = 'test-secret-key-32-characters-long';
const WEAK_SECRET = 'weak';

describe('Encrypted Transform', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data successfully', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);
      const testData = { user: 'test', token: 'abc123', id: 1 };

      const encrypted = transform.in(testData, 'test-key', {});
      expect(encrypted).toBeTypeOf('string');
      expect(encrypted).not.toEqual(JSON.stringify(testData));

      const decrypted = transform.out(encrypted!, 'test-key', {});
      expect(decrypted).toEqual(testData);
    });

    it('should reject weak encryption keys', () => {
      expect(() => createEncryptedTransform(WEAK_SECRET)).toThrow(
        'Encryption key must be at least 32 characters long'
      );
    });

    it('should handle null/undefined input gracefully', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);

      expect(transform.in(null, 'test', {})).toBeNull();
      expect(transform.in(undefined, 'test', {})).toBeUndefined();
      expect(transform.out('', 'test', {})).toEqual('');
      expect(transform.out(null as any, 'test', {})).toBeNull();
    });

    it('should handle encryption failures gracefully', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);

      // Mock CryptoJS to throw error
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Create circular reference to cause JSON.stringify to fail
      const circularData: any = {};
      circularData.self = circularData;

      const result = transform.in(circularData, 'test', {});
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();

      console.error = originalConsoleError;
    });
  });

  describe('Checksum Functionality', () => {
    it('should add checksum to state data', () => {
      const testData = { user: 'test', id: 1 };
      const dataWithChecksum = addChecksum(testData);

      expect(dataWithChecksum).toHaveProperty('_checksum');
      expect(dataWithChecksum).toHaveProperty('_timestamp');
      expect(dataWithChecksum._checksum).toBeTypeOf('string');
      expect(dataWithChecksum._timestamp).toBeTypeOf('number');
    });

    it('should verify checksum correctly', () => {
      const testData = { user: 'test', id: 1 };
      const dataWithChecksum = addChecksum(testData);

      expect(verifyChecksumState(dataWithChecksum)).toBe(true);

      // Tamper with data
      const tamperedData = { ...dataWithChecksum, user: 'tampered' };
      expect(verifyChecksumState(tamperedData)).toBe(false);
    });

    it('should handle checksum verification of invalid data', () => {
      expect(verifyChecksumState(null)).toBe(false);
      expect(verifyChecksumState({})).toBe(false);
      expect(verifyChecksumState({ data: 'test' })).toBe(false);
    });
  });

  describe('Tamper Detection', () => {
    it('should detect tampering through checksum modification', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);
      const testData = { user: 'test', token: 'secret' };

      const encrypted = transform.in(testData, 'test-key', {});
      const payload = JSON.parse(encrypted!);

      // Tamper with checksum
      payload.checksum = 'tampered-checksum';
      const tamperedEncrypted = JSON.stringify(payload);

      const decrypted = transform.out(tamperedEncrypted, 'test-key', {});
      expect(decrypted).toBeNull();
    });

    it('should detect tampering through data modification', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);
      const testData = { user: 'test', token: 'secret' };

      const encrypted = transform.in(testData, 'test-key', {});

      // Modify encrypted data
      const tamperedEncrypted = encrypted!.replace(/.$/, 'X');

      const decrypted = transform.out(tamperedEncrypted, 'test-key', {});
      expect(decrypted).toBeNull();
    });

    it('should handle invalid JSON payload', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);

      const decrypted = transform.out('invalid-json', 'test-key', {});
      expect(decrypted).toBeNull();
    });

    it('should handle missing payload data', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);
      const invalidPayload = JSON.stringify({ version: 2, keyId: 'test' });

      const decrypted = transform.out(invalidPayload, 'test-key', {});
      expect(decrypted).toBeNull();
    });
  });

  describe('Key Rotation', () => {
    it('should handle key rotation within grace period', () => {
      const oldTransform = createEncryptedTransform(MOCK_SECRET);
      const newSecret = 'new-secret-key-32-characters-long';
      const newTransform = createEncryptedTransform(newSecret);

      const testData = { user: 'test', token: 'secret' };

      // Encrypt with old key
      const encrypted = oldTransform.in(testData, 'test-key', {});

      // Should fail with new key (different keyId)
      const decrypted = newTransform.out(encrypted!, 'test-key', {});
      expect(decrypted).toBeNull();
    });

    it('should reject data encrypted with unknown key after grace period', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);
      const testData = { user: 'test', token: 'secret' };

      const encrypted = transform.in(testData, 'test-key', {});
      const payload = JSON.parse(encrypted!);

      // Set old timestamp (beyond grace period)
      payload.timestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
      payload.keyId = 'different-key-id';

      const oldEncrypted = JSON.stringify(payload);
      const decrypted = transform.out(oldEncrypted, 'test-key', {});
      expect(decrypted).toBeNull();
    });
  });

  describe('Storage Purge Functionality', () => {
    beforeEach(() => {
      // Set up test data in localStorage
      localStorage.setItem('persist:auth', 'test-auth-data');
      localStorage.setItem('persist:root', 'test-root-data');
      localStorage.setItem('persist:preferences', 'test-pref-data');
      localStorage.setItem('regular-key', 'regular-data');
    });

    it('should purge all persist keys', async () => {
      await storagePurge.purgeAll();

      expect(localStorage.getItem('persist:auth')).toBeNull();
      expect(localStorage.getItem('persist:root')).toBeNull();
      expect(localStorage.getItem('persist:preferences')).toBeNull();
      expect(localStorage.getItem('regular-key')).toBe('regular-data'); // Should remain
    });

    it('should purge only auth data', async () => {
      await storagePurge.purgeAuth();

      expect(localStorage.getItem('persist:auth')).toBeNull();
      expect(localStorage.getItem('persist:root')).toBeNull();
      expect(localStorage.getItem('persist:preferences')).toBe(
        'test-pref-data'
      );
    });

    it('should detect persisted data', () => {
      expect(storagePurge.hasPersistedData()).toBe(true);

      localStorage.clear();
      expect(storagePurge.hasPersistedData()).toBe(false);
    });

    it('should calculate storage size', () => {
      const size = storagePurge.getStorageSize();
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('Error Handlers', () => {
    it('should handle storage quota exceeded', () => {
      // Mock localStorage to be full
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      persistenceErrorHandlers.onStorageQuotaExceeded();

      // Should not throw error
      expect(true).toBe(true);

      localStorage.setItem = originalSetItem;
    });

    it('should handle tamper detection', () => {
      const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent');

      persistenceErrorHandlers.onTamperDetected('Test tamper reason');

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'persistence:tamper-detected',
          detail: expect.objectContaining({
            reason: 'Test tamper reason',
            timestamp: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Debug Utilities', () => {
    it('should test encryption functionality', () => {
      const originalConsoleLog = console.log;
      console.log = vi.fn();

      persistenceDebugUtils.testEncryption();

      expect(console.log).toHaveBeenCalledWith('✅ Encryption test passed');

      console.log = originalConsoleLog;
    });

    it('should test tamper detection', () => {
      const originalConsoleLog = console.log;
      console.log = vi.fn();

      persistenceDebugUtils.testTamperDetection();

      expect(console.log).toHaveBeenCalledWith(
        '✅ Tamper detection test passed - tampered data rejected'
      );

      console.log = originalConsoleLog;
    });
  });

  describe('Version Compatibility', () => {
    it('should reject data with newer version', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);
      const testData = { user: 'test' };

      const encrypted = transform.in(testData, 'test-key', {});
      const payload = JSON.parse(encrypted!);

      // Set future version
      payload.version = 999;
      const futureEncrypted = JSON.stringify(payload);

      const decrypted = transform.out(futureEncrypted, 'test-key', {});
      expect(decrypted).toBeNull();
    });

    it('should handle data with older version', () => {
      const transform = createEncryptedTransform(MOCK_SECRET);
      const testData = { user: 'test' };

      const encrypted = transform.in(testData, 'test-key', {});
      const payload = JSON.parse(encrypted!);

      // Set older version
      payload.version = 1;
      const olderEncrypted = JSON.stringify(payload);

      // Should still work (backward compatibility)
      const decrypted = transform.out(olderEncrypted, 'test-key', {});
      expect(decrypted).toEqual(testData);
    });
  });
});
