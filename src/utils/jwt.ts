/**
 * JWT (JSON Web Token) utility functions
 * Provides token parsing, validation, and expiry checking
 */

/**
 * JWT payload interface
 */
export interface JWTPayload {
  sub: string; // Subject (user ID)
  iss: string; // Issuer
  aud: string; // Audience
  exp: number; // Expiration time (timestamp)
  iat: number; // Issued at (timestamp)
  nbf?: number; // Not before (timestamp)
  jti?: string; // JWT ID

  // Custom claims
  email?: string;
  role?: string;
  permissions?: string[];
  name?: string;

  // Security claims
  session_id?: string;
  device_id?: string;
  ip_address?: string;
}

/**
 * JWT header interface
 */
export interface JWTHeader {
  alg: string; // Algorithm
  typ: string; // Type
  kid?: string; // Key ID
}

/**
 * Decode JWT token without verification
 * @param token - JWT token string
 * @returns Decoded payload and header
 */
export const decodeJWT = (
  token: string
): { header: JWTHeader; payload: JWTPayload } | null => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1]) {
      return null;
    }

    // Decode header
    const headerDecoded = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
    const header: JWTHeader = JSON.parse(headerDecoded);

    // Decode payload
    const payloadDecoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload: JWTPayload = JSON.parse(payloadDecoded);

    return { header, payload };
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param token - JWT token string
 * @param expiresAt - Optional explicit expiration date string
 * @returns True if token is expired
 */
export const isTokenExpired = (token: string, expiresAt?: string): boolean => {
  try {
    // If explicit expiration date is provided, use it
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      const now = new Date();
      return expDate <= now;
    }

    // Otherwise decode token and check exp claim
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.payload.exp) {
      return true; // Consider invalid tokens as expired
    }

    const now = Math.floor(Date.now() / 1000); // Convert to seconds
    return decoded.payload.exp <= now;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Consider error case as expired for security
  }
};

/**
 * Get token expiration date
 * @param token - JWT token string
 * @returns Expiration date or null if invalid
 */
export const getTokenExpirationDate = (token: string): Date | null => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.payload.exp) {
      return null;
    }

    return new Date(decoded.payload.exp * 1000); // Convert from seconds to milliseconds
  } catch (error) {
    console.error('Error getting token expiration date:', error);
    return null;
  }
};

/**
 * Get time remaining until token expires
 * @param token - JWT token string
 * @param expiresAt - Optional explicit expiration date string
 * @returns Time remaining in milliseconds, or 0 if expired
 */
export const getTokenTimeRemaining = (
  token: string,
  expiresAt?: string
): number => {
  try {
    let expDate: Date | null = null;

    if (expiresAt) {
      expDate = new Date(expiresAt);
    } else {
      expDate = getTokenExpirationDate(token);
    }

    if (!expDate) {
      return 0;
    }

    const timeRemaining = expDate.getTime() - Date.now();
    return Math.max(0, timeRemaining);
  } catch (error) {
    console.error('Error calculating token time remaining:', error);
    return 0;
  }
};

/**
 * Check if token needs refresh (within refresh threshold)
 * @param token - JWT token string
 * @param expiresAt - Optional explicit expiration date string
 * @param refreshThresholdMinutes - Minutes before expiry to trigger refresh (default: 5)
 * @returns True if token should be refreshed
 */
export const shouldRefreshToken = (
  token: string,
  expiresAt?: string,
  refreshThresholdMinutes = 5
): boolean => {
  const timeRemaining = getTokenTimeRemaining(token, expiresAt);
  const thresholdMs = refreshThresholdMinutes * 60 * 1000;

  return timeRemaining > 0 && timeRemaining <= thresholdMs;
};

/**
 * Extract user information from JWT token
 * @param token - JWT token string
 * @returns User information from token payload
 */
export const getUserFromToken = (
  token: string
): Partial<{
  id: string;
  email: string;
  role: string;
  permissions: string[];
  name: string;
  sessionId: string;
}> | null => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded) {
      return null;
    }

    const { payload } = decoded;
    const result: Partial<{
      id: string;
      email: string;
      role: string;
      permissions: string[];
      name: string;
      sessionId: string;
    }> = {
      id: payload.sub,
      permissions: payload.permissions || [],
    };

    if (payload.email) result.email = payload.email;
    if (payload.role) result.role = payload.role;
    if (payload.name) result.name = payload.name;
    if (payload.session_id) result.sessionId = payload.session_id;

    return result;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

/**
 * Validate JWT token structure (basic validation)
 * @param token - JWT token string
 * @returns True if token has valid structure
 */
export const isValidJWTStructure = (token: string): boolean => {
  try {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Try to decode each part
    const decoded = decodeJWT(token);
    return (
      decoded !== null &&
      Boolean(decoded.header.alg) &&
      decoded.header.typ === 'JWT' &&
      Boolean(decoded.payload.sub) &&
      typeof decoded.payload.exp === 'number'
    );
  } catch (error) {
    return false;
  }
};

/**
 * Format token expiration time for display
 * @param token - JWT token string
 * @param expiresAt - Optional explicit expiration date string
 * @returns Formatted expiration string
 */
export const formatTokenExpiration = (
  token: string,
  expiresAt?: string
): string => {
  const timeRemaining = getTokenTimeRemaining(token, expiresAt);

  if (timeRemaining <= 0) {
    return 'Expired';
  }

  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const seconds = Math.floor(timeRemaining / 1000);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
};

/**
 * JWT utility object for easier consumption
 */
export const jwtUtils = {
  decode: decodeJWT,
  isExpired: isTokenExpired,
  getExpirationDate: getTokenExpirationDate,
  getTimeRemaining: getTokenTimeRemaining,
  shouldRefresh: shouldRefreshToken,
  getUserInfo: getUserFromToken,
  isValidStructure: isValidJWTStructure,
  formatExpiration: formatTokenExpiration,
};

/**
 * Export default for convenience
 */
export default jwtUtils;
