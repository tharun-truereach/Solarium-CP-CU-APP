/**
 * Content Security Policy Utilities
 * Provides CSP-related helper functions for security headers and nonce generation
 */

/**
 * Generate a cryptographically secure nonce for CSP
 * Uses Web Crypto API for secure random number generation
 */
export const getCspNonce = (): string => {
  // Generate a random nonce for CSP
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate CSP nonce format
 */
export const isValidCspNonce = (nonce: string): boolean => {
  // CSP nonce should be base64 or hex, at least 128 bits (16 bytes)
  const hexPattern = /^[a-f0-9]{32,}$/i;
  const base64Pattern = /^[A-Za-z0-9+/]{22,}={0,2}$/;

  return hexPattern.test(nonce) || base64Pattern.test(nonce);
};

/**
 * Convert hex nonce to base64 format
 */
export const hexToBase64Nonce = (hexNonce: string): string => {
  const bytes = hexNonce.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [];
  const uint8Array = new Uint8Array(bytes);
  return btoa(String.fromCharCode(...uint8Array));
};
