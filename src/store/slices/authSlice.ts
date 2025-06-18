/**
 * Enhanced Authentication slice for Redux Toolkit
 * Manages user authentication state, tokens, session data, and security features
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { User } from '../../types';
import { isTokenExpired } from '../../utils/jwt';

/**
 * Authentication state interface
 */
export interface AuthState {
  // User data
  user: User | null;

  // Authentication tokens
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;

  // Loading states
  isLoading: boolean;
  isAuthenticated: boolean;

  // Session metadata
  lastActivity: string | null;
  loginTimestamp: string | null;
  sessionWarningShown: boolean;

  // Error state
  error: string | null;

  // Login attempt tracking (security feature)
  loginAttempts: number;
  lockoutUntil: string | null;

  // Session persistence
  rememberMe: boolean;

  // Two-factor authentication (future feature)
  twoFactorRequired: boolean;
  twoFactorToken: string | null;
}

/**
 * Login payload interface
 */
export interface LoginPayload {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: string;
  rememberMe?: boolean;
  twoFactorToken?: string;
}

/**
 * Token update payload interface
 */
export interface TokenUpdatePayload {
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  expiresAt: null,
  isLoading: false,
  isAuthenticated: false,
  lastActivity: null,
  loginTimestamp: null,
  sessionWarningShown: false,
  error: null,
  loginAttempts: 0,
  lockoutUntil: null,
  rememberMe: false,
  twoFactorRequired: false,
  twoFactorToken: null,
};

/**
 * Enhanced authentication slice with comprehensive state management
 */
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null; // Clear error when starting new operation
      }
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Clear error state
     */
    clearError: state => {
      state.error = null;
    },

    /**
     * Enhanced login action - sets user data, tokens, and session metadata
     */
    login: (state, action: PayloadAction<LoginPayload>) => {
      const {
        user,
        token,
        refreshToken,
        expiresAt,
        rememberMe = false,
        twoFactorToken,
      } = action.payload;

      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || null;
      state.expiresAt = expiresAt;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.loginTimestamp = new Date().toISOString();
      state.lastActivity = new Date().toISOString();
      state.sessionWarningShown = false;
      state.rememberMe = rememberMe;
      state.twoFactorToken = twoFactorToken || null;

      // Reset security tracking on successful login
      state.loginAttempts = 0;
      state.lockoutUntil = null;
      state.twoFactorRequired = false;
    },

    /**
     * Enhanced logout action - comprehensive state cleanup
     */
    logout: state => {
      const preservedAttempts = state.loginAttempts;
      const preservedLockout = state.lockoutUntil;

      // Reset to initial state but preserve security tracking
      Object.assign(state, {
        ...initialState,
        loginAttempts: preservedAttempts,
        lockoutUntil: preservedLockout,
      });
    },

    /**
     * Update tokens (for refresh scenarios)
     */
    updateTokens: (state, action: PayloadAction<TokenUpdatePayload>) => {
      const { token, refreshToken, expiresAt } = action.payload;

      state.token = token;
      if (refreshToken) {
        state.refreshToken = refreshToken;
      }
      state.expiresAt = expiresAt;
      state.lastActivity = new Date().toISOString();
      state.sessionWarningShown = false; // Reset warning when tokens are refreshed
      state.error = null;
    },

    /**
     * Update user profile data
     */
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        state.lastActivity = new Date().toISOString();
      }
    },

    /**
     * Update last activity timestamp
     */
    updateActivity: state => {
      state.lastActivity = new Date().toISOString();

      // Clear session warning if user is active
      if (state.sessionWarningShown) {
        state.sessionWarningShown = false;
      }
    },

    /**
     * Mark session as expired
     */
    sessionExpired: state => {
      state.isAuthenticated = false;
      state.token = null;
      state.refreshToken = null;
      state.error = 'Session expired';
      state.sessionWarningShown = false;
    },

    /**
     * Show session warning
     */
    showSessionWarning: state => {
      state.sessionWarningShown = true;
    },

    /**
     * Hide session warning
     */
    hideSessionWarning: state => {
      state.sessionWarningShown = false;
    },

    /**
     * Increment login attempts (security feature)
     */
    incrementLoginAttempts: state => {
      state.loginAttempts += 1;

      // Lock account after 5 failed attempts for 15 minutes
      if (state.loginAttempts >= 5) {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() + 15);
        state.lockoutUntil = lockoutTime.toISOString();
      }
    },

    /**
     * Reset login attempts
     */
    resetLoginAttempts: state => {
      state.loginAttempts = 0;
      state.lockoutUntil = null;
    },

    /**
     * Set two-factor authentication requirement
     */
    setTwoFactorRequired: (state, action: PayloadAction<boolean>) => {
      state.twoFactorRequired = action.payload;
      if (!action.payload) {
        state.twoFactorToken = null;
      }
    },

    /**
     * Set two-factor token
     */
    setTwoFactorToken: (state, action: PayloadAction<string>) => {
      state.twoFactorToken = action.payload;
    },

    /**
     * Update remember me preference
     */
    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload;
    },
  },
});

/**
 * Export action creators
 */
export const {
  setLoading,
  setError,
  clearError,
  login,
  logout,
  updateTokens,
  updateUser,
  updateActivity,
  sessionExpired,
  showSessionWarning,
  hideSessionWarning,
  incrementLoginAttempts,
  resetLoginAttempts,
  setTwoFactorRequired,
  setTwoFactorToken,
  setRememberMe,
} = authSlice.actions;

/**
 * Basic selectors for accessing auth state
 */
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectLastActivity = (state: RootState) => state.auth.lastActivity;
export const selectTokenExpiresAt = (state: RootState) => state.auth.expiresAt;
export const selectLoginAttempts = (state: RootState) =>
  state.auth.loginAttempts;
export const selectLockoutUntil = (state: RootState) => state.auth.lockoutUntil;
export const selectRememberMe = (state: RootState) => state.auth.rememberMe;
export const selectSessionWarningShown = (state: RootState) =>
  state.auth.sessionWarningShown;

/**
 * Enhanced computed selectors with memoization
 */
export const selectUserRole = createSelector(
  [selectUser],
  user => user?.role || null
);

export const selectUserPermissions = createSelector(
  [selectUser],
  user => user?.permissions || []
);

export const selectIsAdmin = createSelector(
  [selectUserRole],
  role => role === 'admin'
);

export const selectIsKAM = createSelector(
  [selectUserRole],
  role => role === 'kam'
);

export const selectIsCP = createSelector(
  [selectUserRole],
  role => role === 'cp'
);

export const selectIsCustomer = createSelector(
  [selectUserRole],
  role => role === 'customer'
);

/**
 * Security-related selectors
 */
export const selectIsTokenExpired = createSelector(
  [selectToken, selectTokenExpiresAt],
  (token, expiresAt) => {
    if (!token || !expiresAt) return true;
    return isTokenExpired(token, expiresAt);
  }
);

export const selectTokenTimeRemaining = createSelector(
  [selectTokenExpiresAt],
  expiresAt => {
    if (!expiresAt) return 0;
    const expDate = new Date(expiresAt);
    const now = new Date();
    return Math.max(0, expDate.getTime() - now.getTime());
  }
);

export const selectIsAccountLocked = createSelector(
  [selectLockoutUntil],
  lockoutUntil => {
    if (!lockoutUntil) return false;
    return new Date(lockoutUntil) > new Date();
  }
);

export const selectSessionStatus = createSelector(
  [
    selectIsAuthenticated,
    selectIsTokenExpired,
    selectIsAccountLocked,
    selectTokenTimeRemaining,
  ],
  (isAuthenticated, isTokenExpired, isAccountLocked, timeRemaining) => ({
    isAuthenticated,
    isTokenExpired,
    isAccountLocked,
    timeRemaining,
    isActive: isAuthenticated && !isTokenExpired && !isAccountLocked,
    needsWarning: timeRemaining > 0 && timeRemaining < 5 * 60 * 1000, // 5 minutes
  })
);

/**
 * Permission checking selectors
 */
export const createPermissionSelector = (requiredPermissions: string[]) =>
  createSelector([selectUserPermissions], permissions =>
    requiredPermissions.every(perm => permissions.includes(perm))
  );

export const createRoleSelector = (allowedRoles: string[]) =>
  createSelector([selectUserRole], role =>
    role ? allowedRoles.includes(role) : false
  );

/**
 * Export the reducer
 */
export default authSlice.reducer;
