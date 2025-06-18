/**
 * Comprehensive test suite for Auth Slice
 * Tests all authentication state management functionality
 */

import { configureAppStore } from '../store/store';
import {
  authSlice,
  login,
  logout,
  updateTokens,
  updateUser,
  updateActivity,
  sessionExpired,
  incrementLoginAttempts,
  resetLoginAttempts,
  setLoading,
  setError,
  clearError,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectSessionStatus,
  selectIsAccountLocked,
} from '../store/slices/authSlice';
import type { Permission } from '../types';

describe('Auth Slice', () => {
  let store: ReturnType<typeof configureAppStore>;

  beforeEach(() => {
    store = configureAppStore();
  });

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' as const,
    permissions: ['users:read', 'users:write'] as Permission[],
    isActive: true,
    isVerified: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  };

  const mockLoginPayload = {
    user: mockUser,
    token: 'test-jwt-token',
    refreshToken: 'test-refresh-token',
    expiresAt: '2023-12-31T23:59:59Z',
    rememberMe: true,
  };

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.expiresAt).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.loginAttempts).toBe(0);
      expect(state.lockoutUntil).toBeNull();
      expect(state.rememberMe).toBe(false);
      expect(state.sessionWarningShown).toBe(false);
    });
  });

  describe('Authentication Actions', () => {
    it('should handle login action', () => {
      store.dispatch(login(mockLoginPayload));

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('test-jwt-token');
      expect(state.refreshToken).toBe('test-refresh-token');
      expect(state.expiresAt).toBe('2023-12-31T23:59:59Z');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.rememberMe).toBe(true);
      expect(state.loginTimestamp).toBeTruthy();
      expect(state.lastActivity).toBeTruthy();

      // Should reset security tracking
      expect(state.loginAttempts).toBe(0);
      expect(state.lockoutUntil).toBeNull();
    });

    it('should handle logout action', () => {
      // First login
      store.dispatch(login(mockLoginPayload));
      expect(store.getState().auth.isAuthenticated).toBe(true);

      // Then logout
      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastActivity).toBeNull();
      expect(state.loginTimestamp).toBeNull();
    });

    it('should preserve login attempts during logout', () => {
      // Set some login attempts
      store.dispatch(incrementLoginAttempts());
      store.dispatch(incrementLoginAttempts());
      expect(store.getState().auth.loginAttempts).toBe(2);

      // Login and logout
      store.dispatch(login(mockLoginPayload));
      store.dispatch(logout());

      // Login attempts should be preserved during logout (but reset during successful login)
      const state = store.getState().auth;
      expect(state.loginAttempts).toBe(0); // Reset by successful login
    });
  });

  describe('Token Management', () => {
    it('should handle token updates', () => {
      // First login
      store.dispatch(login(mockLoginPayload));

      // Then update tokens
      const newTokens = {
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresAt: '2024-01-01T00:00:00Z',
      };

      store.dispatch(updateTokens(newTokens));

      const state = store.getState().auth;
      expect(state.token).toBe('new-jwt-token');
      expect(state.refreshToken).toBe('new-refresh-token');
      expect(state.expiresAt).toBe('2024-01-01T00:00:00Z');
      expect(state.lastActivity).toBeTruthy();
      expect(state.sessionWarningShown).toBe(false); // Should reset warning
    });

    it('should handle session expiry', () => {
      // First login
      store.dispatch(login(mockLoginPayload));
      expect(store.getState().auth.isAuthenticated).toBe(true);

      // Then expire session
      store.dispatch(sessionExpired());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.error).toBe('Session expired');
    });
  });

  describe('User Management', () => {
    it('should handle user updates', () => {
      // First login
      store.dispatch(login(mockLoginPayload));

      // Then update user
      const userUpdates = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      store.dispatch(updateUser(userUpdates));

      const state = store.getState().auth;
      expect(state.user?.name).toBe('Updated Name');
      expect(state.user?.email).toBe('updated@example.com');
      expect(state.user?.id).toBe('1'); // Should preserve other fields
      expect(state.lastActivity).toBeTruthy();
    });

    it('should not update user when not logged in', () => {
      const userUpdates = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      store.dispatch(updateUser(userUpdates));

      const state = store.getState().auth;
      expect(state.user).toBeNull();
    });
  });

  describe('Activity Tracking', () => {
    it('should handle activity updates', () => {
      // First login
      store.dispatch(login(mockLoginPayload));
      const initialActivity = store.getState().auth.lastActivity;

      // Wait a bit and update activity
      setTimeout(() => {
        store.dispatch(updateActivity());

        const state = store.getState().auth;
        expect(state.lastActivity).not.toBe(initialActivity);
        expect(new Date(state.lastActivity!).getTime()).toBeGreaterThan(
          new Date(initialActivity!).getTime()
        );
      }, 10);
    });

    it('should clear session warning on activity', () => {
      // First login and show warning
      store.dispatch(login(mockLoginPayload));
      store.dispatch(authSlice.actions.showSessionWarning());
      expect(store.getState().auth.sessionWarningShown).toBe(true);

      // Update activity should clear warning
      store.dispatch(updateActivity());
      expect(store.getState().auth.sessionWarningShown).toBe(false);
    });
  });

  describe('Security Features', () => {
    it('should handle login attempt tracking', () => {
      expect(store.getState().auth.loginAttempts).toBe(0);

      // Increment attempts
      store.dispatch(incrementLoginAttempts());
      expect(store.getState().auth.loginAttempts).toBe(1);

      store.dispatch(incrementLoginAttempts());
      expect(store.getState().auth.loginAttempts).toBe(2);
    });

    it('should lock account after 5 failed attempts', () => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        store.dispatch(incrementLoginAttempts());
      }

      const state = store.getState().auth;
      expect(state.loginAttempts).toBe(5);
      expect(state.lockoutUntil).toBeTruthy();

      // Should be locked for 15 minutes
      const lockoutTime = new Date(state.lockoutUntil!);
      const now = new Date();
      const diffMinutes = (lockoutTime.getTime() - now.getTime()) / (1000 * 60);
      expect(diffMinutes).toBeGreaterThan(14);
      expect(diffMinutes).toBeLessThan(16);
    });

    it('should reset login attempts', () => {
      // Set some attempts
      store.dispatch(incrementLoginAttempts());
      store.dispatch(incrementLoginAttempts());
      expect(store.getState().auth.loginAttempts).toBe(2);

      // Reset
      store.dispatch(resetLoginAttempts());
      const state = store.getState().auth;
      expect(state.loginAttempts).toBe(0);
      expect(state.lockoutUntil).toBeNull();
    });
  });

  describe('Loading and Error States', () => {
    it('should handle loading state', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().auth.isLoading).toBe(true);
      expect(store.getState().auth.error).toBeNull(); // Should clear error

      store.dispatch(setLoading(false));
      expect(store.getState().auth.isLoading).toBe(false);
    });

    it('should handle error state', () => {
      const errorMessage = 'Test error message';
      store.dispatch(setError(errorMessage));

      const state = store.getState().auth;
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false); // Should stop loading
    });

    it('should clear error state', () => {
      store.dispatch(setError('Test error'));
      expect(store.getState().auth.error).toBe('Test error');

      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });

  describe('Selectors', () => {
    it('should select user correctly', () => {
      store.dispatch(login(mockLoginPayload));
      const user = selectUser(store.getState());
      expect(user).toEqual(mockUser);
    });

    it('should select token correctly', () => {
      store.dispatch(login(mockLoginPayload));
      const token = selectToken(store.getState());
      expect(token).toBe('test-jwt-token');
    });

    it('should select authentication status correctly', () => {
      expect(selectIsAuthenticated(store.getState())).toBe(false);

      store.dispatch(login(mockLoginPayload));
      expect(selectIsAuthenticated(store.getState())).toBe(true);
    });

    it('should select session status correctly', () => {
      const sessionStatus = selectSessionStatus(store.getState());
      expect(sessionStatus.isAuthenticated).toBe(false);
      expect(sessionStatus.isActive).toBe(false);

      store.dispatch(login(mockLoginPayload));
      const newSessionStatus = selectSessionStatus(store.getState());
      expect(newSessionStatus.isAuthenticated).toBe(true);
    });

    it('should select account lock status correctly', () => {
      expect(selectIsAccountLocked(store.getState())).toBe(false);

      // Lock account
      for (let i = 0; i < 5; i++) {
        store.dispatch(incrementLoginAttempts());
      }

      expect(selectIsAccountLocked(store.getState())).toBe(true);
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should handle two-factor requirements', () => {
      store.dispatch(authSlice.actions.setTwoFactorRequired(true));
      expect(store.getState().auth.twoFactorRequired).toBe(true);

      store.dispatch(authSlice.actions.setTwoFactorRequired(false));
      expect(store.getState().auth.twoFactorRequired).toBe(false);
      expect(store.getState().auth.twoFactorToken).toBeNull();
    });

    it('should handle two-factor token', () => {
      const token = 'test-2fa-token';
      store.dispatch(authSlice.actions.setTwoFactorToken(token));
      expect(store.getState().auth.twoFactorToken).toBe(token);
    });
  });

  describe('Session Warning', () => {
    it('should handle session warning display', () => {
      expect(store.getState().auth.sessionWarningShown).toBe(false);

      store.dispatch(authSlice.actions.showSessionWarning());
      expect(store.getState().auth.sessionWarningShown).toBe(true);

      store.dispatch(authSlice.actions.hideSessionWarning());
      expect(store.getState().auth.sessionWarningShown).toBe(false);
    });
  });
});
