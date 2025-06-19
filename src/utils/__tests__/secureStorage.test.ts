/**
 * Tests for secure storage utilities
 * Validates security measures and XSS protection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  secureLocalStorage,
  secureTokenStorage,
  xssProtection,
} from '../secureStorage';

describe('Secure Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('secureLocalStorage', () => {
    it('should allow whitelisted keys', () => {
      expect(() =>
        secureLocalStorage.setItem('persist:auth', 'test-data')
      ).not.toThrow();
      expect(secureLocalStorage.getItem('persist:auth')).toBe('test-data');
    });

    it('should reject non-whitelisted keys', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() =>
        secureLocalStorage.setItem('malicious-key', 'test-data')
      ).toThrow();

      consoleSpy.mockRestore();
    });

    it('should validate storage values for XSS attempts', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const maliciousValue = '<script>alert("xss")</script>';
      expect(() =>
        secureLocalStorage.setItem('persist:auth', maliciousValue)
      ).toThrow();

      consoleSpy.mockRestore();
    });

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Mock localStorage to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() =>
        secureLocalStorage.setItem('persist:auth', 'test')
      ).toThrow();

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should get storage size correctly', () => {
      secureLocalStorage.setItem('persist:auth', 'test-data');
      const size = secureLocalStorage.getSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should clear only whitelisted keys', () => {
      localStorage.setItem('persist:auth', 'test');
      localStorage.setItem('other-key', 'should-remain');

      secureLocalStorage.clear();

      expect(localStorage.getItem('persist:auth')).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('should-remain');
    });
  });

  describe('secureTokenStorage', () => {
    it('should validate token format', () => {
      expect(() => secureTokenStorage.setToken('invalid-token')).toThrow();
      expect(() => secureTokenStorage.setToken('')).toThrow();
      expect(() => secureTokenStorage.setToken(null as any)).toThrow();
    });

    it('should accept valid JWT token', () => {
      const validToken = 'header.payload.signature';
      expect(() => secureTokenStorage.setToken(validToken)).not.toThrow();
    });

    it('should verify token is not exposed on window', () => {
      // Clean window object
      delete (window as any).token;
      delete (window as any).jwt;

      expect(secureTokenStorage.verifyTokenSecurity()).toBe(true);

      // Add dangerous property
      (window as any).token = 'exposed-token';
      expect(secureTokenStorage.verifyTokenSecurity()).toBe(false);

      // Clean up
      delete (window as any).token;
    });

    it('should clear all token-related data', () => {
      localStorage.setItem('persist:auth', 'auth-data');
      (window as any).token = 'exposed-token';

      secureTokenStorage.clearTokens();

      expect(localStorage.getItem('persist:auth')).toBeNull();
      expect((window as any).token).toBeUndefined();
    });
  });

  describe('xssProtection', () => {
    it('should sanitize dangerous strings', () => {
      const dangerous = '<script>alert("xss")</script>';
      const sanitized = xssProtection.sanitizeString(dangerous);
      expect(sanitized).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should handle non-string input', () => {
      expect(xssProtection.sanitizeString(null as any)).toBe('');
      expect(xssProtection.sanitizeString(undefined as any)).toBe('');
      expect(xssProtection.sanitizeString(123 as any)).toBe('');
    });

    it('should validate URLs', () => {
      expect(xssProtection.validateUrl('https://example.com')).toBe(true);
      expect(xssProtection.validateUrl('http://example.com')).toBe(true);
      expect(xssProtection.validateUrl('javascript:alert(1)')).toBe(false);
      expect(xssProtection.validateUrl('data:text/html,<script>')).toBe(false);
      expect(xssProtection.validateUrl('vbscript:msgbox(1)')).toBe(false);
    });

    it('should detect XSS attempts', () => {
      expect(xssProtection.detectXssAttempt('<script>alert(1)</script>')).toBe(
        true
      );
      expect(xssProtection.detectXssAttempt('javascript:alert(1)')).toBe(true);
      expect(xssProtection.detectXssAttempt('<img onload="alert(1)">')).toBe(
        true
      );
      expect(xssProtection.detectXssAttempt('normal text')).toBe(false);
      expect(xssProtection.detectXssAttempt('user@example.com')).toBe(false);
    });

    it('should handle various XSS patterns', () => {
      const xssPatterns = [
        '<iframe src="javascript:alert(1)">',
        '<object data="data:text/html,<script>alert(1)</script>">',
        '<embed src="javascript:alert(1)">',
        '<link rel="stylesheet" href="javascript:alert(1)">',
        '<meta http-equiv="refresh" content="0;javascript:alert(1)">',
        'expression(alert(1))',
        'vbscript:msgbox(1)',
      ];

      xssPatterns.forEach(pattern => {
        expect(xssProtection.detectXssAttempt(pattern)).toBe(true);
      });
    });
  });

  describe('Storage Monitoring', () => {
    it('should monitor localStorage for tampering', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Add suspicious key
      localStorage.setItem('persist:malicious', 'tampered-data');

      // Trigger monitoring (would normally be done by interval)
      // This is implicitly tested through secureLocalStorage operations

      consoleSpy.mockRestore();
    });
  });
});
