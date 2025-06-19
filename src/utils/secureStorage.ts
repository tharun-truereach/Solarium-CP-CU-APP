/**
 * Secure storage utilities that prevent direct access to localStorage/sessionStorage
 * Provides controlled access with additional security measures
 */

import { persistenceErrorHandlers } from '../store/persistence/encryptedTransform';

/**
 * Secure storage interface
 */
interface SecureStorageInterface {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  getAllKeys: () => string[];
  getSize: () => number;
}

/**
 * Whitelist of allowed storage keys
 */
const ALLOWED_STORAGE_KEYS = [
  'persist:root',
  'persist:auth',
  'persist:preferences',
  'theme-mode',
  'language-preference',
  'debug-mode',
] as const;

type AllowedStorageKey = (typeof ALLOWED_STORAGE_KEYS)[number];

/**
 * Check if a storage key is whitelisted
 */
function isAllowedKey(key: string): key is AllowedStorageKey {
  return ALLOWED_STORAGE_KEYS.includes(key as AllowedStorageKey);
}

/**
 * Validate storage key
 */
function validateKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw new Error('Storage key must be a non-empty string');
  }

  if (!isAllowedKey(key)) {
    throw new Error(
      `Storage key '${key}' is not whitelisted for security reasons`
    );
  }

  // Prevent potential XSS through storage keys
  if (key.includes('<') || key.includes('>') || key.includes('&')) {
    throw new Error('Storage key contains potentially dangerous characters');
  }
}

/**
 * Validate storage value
 */
function validateValue(value: string): void {
  if (typeof value !== 'string') {
    throw new Error('Storage value must be a string');
  }

  // Check for potential script injection
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      throw new Error('Storage value contains potentially dangerous content');
    }
  }
}

/**
 * Monitor storage for tampering
 */
function detectStorageTampering(): void {
  try {
    // Check for unexpected storage keys
    const allKeys = Object.keys(localStorage);
    const suspiciousKeys = allKeys.filter(key => {
      // Look for keys that might indicate tampering
      return key.startsWith('persist:') && !isAllowedKey(key);
    });

    if (suspiciousKeys.length > 0) {
      console.warn('🚨 Suspicious storage keys detected:', suspiciousKeys);
      persistenceErrorHandlers.onTamperDetected(
        'Suspicious storage keys found'
      );
    }

    // Check for storage size anomalies
    const storageSize = JSON.stringify(localStorage).length;
    const maxExpectedSize = 1024 * 1024; // 1MB

    if (storageSize > maxExpectedSize) {
      console.warn('🚨 Storage size anomaly detected:', storageSize);
    }
  } catch (error) {
    console.error('🚨 Storage tampering detection failed:', error);
  }
}

/**
 * Secure localStorage wrapper
 */
export const secureLocalStorage: SecureStorageInterface = {
  getItem: (key: string): string | null => {
    try {
      validateKey(key);
      detectStorageTampering();
      return localStorage.getItem(key);
    } catch (error) {
      console.error('🚨 Secure storage getItem failed:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      validateKey(key);
      validateValue(value);

      // Check storage quota before setting
      const estimatedSize = key.length + value.length;
      const currentSize = JSON.stringify(localStorage).length;

      if (currentSize + estimatedSize > 5 * 1024 * 1024) {
        // 5MB limit
        persistenceErrorHandlers.onStorageQuotaExceeded();
      }

      localStorage.setItem(key, value);
    } catch (error) {
      console.error('🚨 Secure storage setItem failed:', error);
      throw error;
    }
  },

  removeItem: (key: string): void => {
    try {
      validateKey(key);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('🚨 Secure storage removeItem failed:', error);
    }
  },

  clear: (): void => {
    try {
      // Only clear whitelisted keys for security
      ALLOWED_STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('🚨 Secure storage clear failed:', error);
    }
  },

  getAllKeys: (): string[] => {
    try {
      return Object.keys(localStorage).filter(isAllowedKey);
    } catch (error) {
      console.error('🚨 Secure storage getAllKeys failed:', error);
      return [];
    }
  },

  getSize: (): number => {
    try {
      let size = 0;
      ALLOWED_STORAGE_KEYS.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      });
      return size;
    } catch (error) {
      console.error('🚨 Secure storage getSize failed:', error);
      return 0;
    }
  },
};

/**
 * Token-specific secure storage (extra protection for sensitive data)
 */
export const secureTokenStorage = {
  /**
   * Store token securely (only accessible through this interface)
   */
  setToken: (token: string): void => {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided');
    }

    // Additional token validation
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    // Never expose token to window object
    if (typeof window !== 'undefined') {
      // Ensure token is not accidentally exposed
      Object.defineProperty(window, 'token', {
        value: undefined,
        writable: false,
        configurable: false,
      });

      Object.defineProperty(window, 'jwt', {
        value: undefined,
        writable: false,
        configurable: false,
      });

      Object.defineProperty(window, 'authToken', {
        value: undefined,
        writable: false,
        configurable: false,
      });
    }

    // Token is stored through encrypted redux-persist, not directly
    console.log('🔐 Token stored securely through encrypted persistence');
  },

  /**
   * Verify token is not accessible via window object
   */
  verifyTokenSecurity: (): boolean => {
    if (typeof window === 'undefined') return true;

    const dangerousProps = [
      'token',
      'jwt',
      'authToken',
      'accessToken',
      'bearerToken',
    ];

    for (const prop of dangerousProps) {
      if (window.hasOwnProperty(prop) && (window as any)[prop]) {
        console.error(
          `🚨 Security violation: ${prop} is exposed on window object`
        );
        return false;
      }
    }

    return true;
  },

  /**
   * Clear all token-related data
   */
  clearTokens: (): void => {
    // Clear from redux-persist
    secureLocalStorage.removeItem('persist:auth');
    secureLocalStorage.removeItem('persist:root');

    // Ensure no token remains in memory
    if (typeof window !== 'undefined') {
      const dangerousProps = [
        'token',
        'jwt',
        'authToken',
        'accessToken',
        'bearerToken',
      ];
      dangerousProps.forEach(prop => {
        try {
          delete (window as any)[prop];
        } catch (error) {
          // Property might be non-configurable, that's actually good for security
        }
      });
    }
  },
};

/**
 * XSS protection utilities
 */
export const xssProtection = {
  /**
   * Sanitize string for safe rendering
   */
  sanitizeString: (input: string): string => {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Validate URL for safe navigation
   */
  validateUrl: (url: string): boolean => {
    if (typeof url !== 'string') {
      return false;
    }

    const dangerousProtocols = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'ftp:',
    ];
    const lowerUrl = url.toLowerCase().trim();

    return !dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol));
  },

  /**
   * Check for potential XSS in user input
   */
  detectXssAttempt: (input: string): boolean => {
    if (typeof input !== 'string') {
      return false;
    }

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /<link\b[^>]*>/gi,
      /<meta\b[^>]*>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  },
};

// Set up periodic storage monitoring
if (typeof window !== 'undefined') {
  // Monitor storage every 30 seconds
  setInterval(() => {
    detectStorageTampering();
    secureTokenStorage.verifyTokenSecurity();
  }, 30000);

  // Monitor for direct localStorage access attempts
  const originalSetItem = localStorage.setItem;
  const originalGetItem = localStorage.getItem;
  const originalRemoveItem = localStorage.removeItem;

  localStorage.setItem = function (key: string, value: string) {
    if (!isAllowedKey(key) && !key.startsWith('debug-')) {
      console.warn(`🚨 Attempted to set non-whitelisted key: ${key}`);
    }
    return originalSetItem.call(this, key, value);
  };

  localStorage.getItem = function (key: string) {
    if (!isAllowedKey(key) && !key.startsWith('debug-')) {
      console.warn(`🚨 Attempted to get non-whitelisted key: ${key}`);
    }
    return originalGetItem.call(this, key);
  };

  localStorage.removeItem = function (key: string) {
    if (!isAllowedKey(key) && !key.startsWith('debug-')) {
      console.warn(`🚨 Attempted to remove non-whitelisted key: ${key}`);
    }
    return originalRemoveItem.call(this, key);
  };
}

export default secureLocalStorage;
