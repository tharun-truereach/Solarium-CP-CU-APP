/**
 * Enhanced Authentication API endpoints using RTK Query
 * Handles login, logout, token refresh, and comprehensive user management operations
 */

import { baseApi } from '../baseApi';
import type {
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  User,
  ProfileUpdatePayload,
  PasswordChangePayload,
} from '../../types';
import { jwtUtils } from '../../utils/jwt';

/**
 * Extended login credentials for enhanced authentication
 */
export interface ExtendedLoginCredentials extends LoginCredentials {
  deviceId?: string;
  twoFactorCode?: string;
  captchaToken?: string;
}

/**
 * Login response with additional metadata
 */
export interface ExtendedLoginResponse extends LoginResponse {
  sessionId: string;
  requiresTwoFactor?: boolean;
  lockoutInfo?: {
    attempts: number;
    lockedUntil?: string;
  };
}

/**
 * Password reset request payload
 */
export interface PasswordResetRequest {
  email: string;
  captchaToken?: string;
}

/**
 * Password reset confirmation payload
 */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Two-factor authentication setup payload
 */
export interface TwoFactorSetup {
  secret: string;
  code: string;
}

/**
 * Session information interface
 */
export interface SessionInfo {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  lastActivity: string;
  isCurrent: boolean;
  browser?: string;
  os?: string;
}

/**
 * Enhanced auth endpoints extension of base API
 */
export const authEndpoints = baseApi.injectEndpoints({
  endpoints: builder => ({
    /**
     * Enhanced login mutation with security features
     */
    login: builder.mutation<ExtendedLoginResponse, ExtendedLoginCredentials>({
      query: credentials => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Auth'],
      transformResponse: (response: ExtendedLoginResponse) => {
        // Validate JWT token structure
        if (response.token && !jwtUtils.isValidStructure(response.token)) {
          throw new Error('Invalid token received from server');
        }

        // Log successful login (without sensitive data)
        console.log('✅ Login successful:', {
          userId: response.user.id,
          role: response.user.role,
          sessionId: response.sessionId,
          tokenExpiry: jwtUtils.formatExpiration(
            response.token,
            response.expiresAt
          ),
          requiresTwoFactor: response.requiresTwoFactor,
        });

        return response;
      },
      transformErrorResponse: (response: any) => {
        console.error(
          '❌ Login failed:',
          response.status,
          response.data?.message
        );

        return {
          status: response.status,
          message: response.data?.message || 'Login failed',
          lockoutInfo: response.data?.lockoutInfo,
          requiresCaptcha: response.data?.requiresCaptcha,
          data: response.data,
        };
      },
    }),

    /**
     * Enhanced logout mutation
     */
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Auth'],
      onQueryStarted: async (arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          console.log('✅ Logout API successful');
        } catch (error) {
          console.warn('⚠️ Logout API failed, proceeding with local logout');
        }
      },
      transformErrorResponse: (response: any) => {
        return {
          status: response.status,
          message: response.data?.message || 'Logout failed',
        };
      },
    }),

    /**
     * Enhanced refresh token mutation
     */
    refreshToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      transformResponse: (response: RefreshTokenResponse) => {
        // Validate new token
        if (!jwtUtils.isValidStructure(response.token)) {
          throw new Error('Invalid refresh token received');
        }

        console.log('🔄 Token refreshed successfully:', {
          tokenExpiry: jwtUtils.formatExpiration(
            response.token,
            response.expiresAt
          ),
        });

        return response;
      },
      transformErrorResponse: (response: any) => {
        console.error('❌ Token refresh failed:', response.status);
        return {
          status: response.status,
          message: response.data?.message || 'Token refresh failed',
        };
      },
    }),

    /**
     * Verify token validity
     */
    verifyToken: builder.query<{ valid: boolean; user?: User }, void>({
      query: () => '/auth/verify',
      providesTags: ['Auth'],
      transformResponse: (response: { valid: boolean; user?: User }) => {
        if (response.valid) {
          console.log('✅ Token verified successfully');
        } else {
          console.warn('⚠️ Token verification failed');
        }
        return response;
      },
      transformErrorResponse: () => ({
        valid: false,
        message: 'Token verification failed',
      }),
    }),

    /**
     * Get current user profile
     */
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
      transformResponse: (user: User) => {
        console.log('👤 User profile loaded:', {
          id: user.id,
          email: user.email,
          role: user.role,
        });
        return user;
      },
    }),

    /**
     * Update user profile
     */
    updateProfile: builder.mutation<User, ProfileUpdatePayload>({
      query: profileData => ({
        url: '/auth/profile',
        method: 'PATCH',
        body: profileData,
      }),
      invalidatesTags: ['User'],
      transformResponse: (user: User) => {
        console.log('✅ Profile updated successfully');
        return user;
      },
      transformErrorResponse: (response: any) => {
        return {
          status: response.status,
          message: response.data?.message || 'Profile update failed',
          errors: response.data?.errors,
        };
      },
    }),

    /**
     * Change password
     */
    changePassword: builder.mutation<void, PasswordChangePayload>({
      query: passwordData => ({
        url: '/auth/change-password',
        method: 'POST',
        body: passwordData,
      }),
      transformResponse: () => {
        console.log('✅ Password changed successfully');
      },
      transformErrorResponse: (response: any) => {
        return {
          status: response.status,
          message: response.data?.message || 'Password change failed',
          errors: response.data?.errors,
        };
      },
    }),

    /**
     * Request password reset
     */
    requestPasswordReset: builder.mutation<void, PasswordResetRequest>({
      query: resetData => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: resetData,
      }),
      transformResponse: () => {
        console.log('✅ Password reset email sent');
      },
      transformErrorResponse: (response: any) => {
        return {
          status: response.status,
          message: response.data?.message || 'Password reset request failed',
        };
      },
    }),

    /**
     * Confirm password reset
     */
    confirmPasswordReset: builder.mutation<void, PasswordResetConfirm>({
      query: resetData => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: resetData,
      }),
      transformResponse: () => {
        console.log('✅ Password reset completed');
      },
      transformErrorResponse: (response: any) => {
        return {
          status: response.status,
          message: response.data?.message || 'Password reset failed',
        };
      },
    }),

    /**
     * Setup two-factor authentication
     */
    setupTwoFactor: builder.mutation<
      { qrCode: string; backupCodes: string[] },
      void
    >({
      query: () => ({
        url: '/auth/2fa/setup',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
      transformResponse: (response: {
        qrCode: string;
        backupCodes: string[];
      }) => {
        console.log('🔐 Two-factor authentication setup initiated');
        return response;
      },
    }),

    /**
     * Confirm two-factor authentication setup
     */
    confirmTwoFactor: builder.mutation<void, TwoFactorSetup>({
      query: setupData => ({
        url: '/auth/2fa/confirm',
        method: 'POST',
        body: setupData,
      }),
      invalidatesTags: ['User'],
      transformResponse: () => {
        console.log('✅ Two-factor authentication enabled');
      },
    }),

    /**
     * Disable two-factor authentication
     */
    disableTwoFactor: builder.mutation<
      void,
      { password: string; code: string }
    >({
      query: disableData => ({
        url: '/auth/2fa/disable',
        method: 'POST',
        body: disableData,
      }),
      invalidatesTags: ['User'],
      transformResponse: () => {
        console.log('✅ Two-factor authentication disabled');
      },
    }),

    /**
     * Get active sessions
     */
    getActiveSessions: builder.query<SessionInfo[], void>({
      query: () => '/auth/sessions',
      providesTags: ['Auth'],
      transformResponse: (sessions: SessionInfo[]) => {
        console.log('📱 Active sessions loaded:', sessions.length);
        return sessions;
      },
    }),

    /**
     * Revoke session
     */
    revokeSession: builder.mutation<void, string>({
      query: sessionId => ({
        url: `/auth/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth'],
      transformResponse: () => {
        console.log('✅ Session revoked successfully');
      },
    }),

    /**
     * Revoke all other sessions
     */
    revokeAllSessions: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/sessions/revoke-all',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
      transformResponse: () => {
        console.log('✅ All other sessions revoked');
      },
    }),

    /**
     * Check authentication status
     */
    checkAuthStatus: builder.query<
      {
        isAuthenticated: boolean;
        user?: User;
        tokenExpiry?: string;
        needsRefresh?: boolean;
      },
      void
    >({
      query: () => '/auth/status',
      providesTags: ['Auth'],
      transformResponse: (response: any) => {
        console.log(
          '🔍 Auth status checked:',
          response.isAuthenticated ? 'authenticated' : 'not authenticated'
        );
        return response;
      },
    }),
  }),
  overrideExisting: true,
});

/**
 * Export hooks for use in components
 */
export const {
  // Authentication
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useVerifyTokenQuery,
  useCheckAuthStatusQuery,

  // User management
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,

  // Password reset
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,

  // Two-factor authentication
  useSetupTwoFactorMutation,
  useConfirmTwoFactorMutation,
  useDisableTwoFactorMutation,

  // Session management
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllSessionsMutation,
} = authEndpoints;

/**
 * Export endpoint selectors for advanced usage
 */
export const authSelectors = authEndpoints.endpoints;

/**
 * Export endpoints for direct access
 */
export default authEndpoints;
