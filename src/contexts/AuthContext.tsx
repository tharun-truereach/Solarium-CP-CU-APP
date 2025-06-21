/**
 * Enhanced Authentication Context Provider - Redux Façade
 * Provides backward-compatible AuthContext API while using Redux store internally
 * Now fully integrated with enhanced auth slice and RTK Query endpoints
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  login as loginAction,
  logout as logoutAction,
  setLoading,
  setError,
  clearError,
  updateActivity,
  updateUser,
  incrementLoginAttempts,
  resetLoginAttempts,
  showSessionWarning,
  hideSessionWarning,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
  selectSessionStatus,
  selectIsAccountLocked,
  selectLoginAttempts,
  selectTokenTimeRemaining,
  createPermissionSelector,
  createRoleSelector,
} from '@/store/slices/authSlice';
import { LoginCredentials, User } from '@/types';
import {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useVerifyTokenQuery,
  ExtendedLoginCredentials,
} from '../api/endpoints/authEndpoints';
import { storeUtils } from '../store/store';
import { jwtUtils } from '../utils/jwt';

// Enhanced AuthContext interface - maintains backward compatibility while adding new features
export interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Enhanced state
  sessionStatus: {
    isAuthenticated: boolean;
    isTokenExpired: boolean;
    isAccountLocked: boolean;
    timeRemaining: number;
    isActive: boolean;
    needsWarning: boolean;
  };
  loginAttempts: number;
  isAccountLocked: boolean;

  // Actions
  login: (
    credentials: LoginCredentials | ExtendedLoginCredentials
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  checkPermission: (permissions: string[]) => boolean;
  checkRole: (allowedRoles: string[]) => boolean;

  // Enhanced actions
  clearError: () => void;
  updateUserActivity: () => void;
  showSessionExpiredWarning: () => void;
  hideSessionExpiredWarning: () => void;

  // Utilities
  getTokenTimeRemaining: () => number;
  formatTokenExpiration: () => string;
  isTokenExpiringSoon: (thresholdMinutes?: number) => boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Enhanced AuthProvider component - wraps Redux logic with comprehensive authentication features
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();

  // Redux state selectors
  const user = useAppSelector(selectUser);
  const token = useAppSelector(selectToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectAuthError);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const isAccountLocked = useAppSelector(selectIsAccountLocked);
  const loginAttempts = useAppSelector(selectLoginAttempts);
  const tokenTimeRemaining = useAppSelector(selectTokenTimeRemaining);

  // RTK Query hooks
  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [refreshTokenMutation] = useRefreshTokenMutation();
  const [updateProfileMutation] = useUpdateProfileMutation();

  // Reset loading state on mount to prevent stuck loading
  useEffect(() => {
    dispatch(setLoading(false));
  }, [dispatch]);

  // Auto-verify token and fetch current user when authenticated
  useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  const { data: tokenVerification } = useVerifyTokenQuery(undefined, {
    skip: !token,
    pollingInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Memoized permission and role checkers
  const permissionChecker = useMemo(() => {
    return (permissions: string[]) => {
      const selector = createPermissionSelector(permissions);
      return selector({ auth: { user } } as any);
    };
  }, [user]);

  const roleChecker = useMemo(() => {
    return (allowedRoles: string[]) => {
      const selector = createRoleSelector(allowedRoles);
      return selector({ auth: { user } } as any);
    };
  }, [user]);

  /**
   * Enhanced login function with comprehensive error handling
   */
  const login = useCallback(
    async (credentials: LoginCredentials | ExtendedLoginCredentials) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        // Check if account is locked
        if (isAccountLocked) {
          throw new Error(
            'Account is temporarily locked due to too many failed login attempts'
          );
        }

        const result = await loginMutation(
          credentials as ExtendedLoginCredentials
        ).unwrap();

        // Dispatch login action with result
        dispatch(
          loginAction({
            user: result.user,
            token: result.token,
            ...(result.refreshToken && { refreshToken: result.refreshToken }),
            expiresAt: result.expiresAt,
            ...((credentials as ExtendedLoginCredentials).rememberMe && {
              rememberMe: (credentials as ExtendedLoginCredentials).rememberMe,
            }),
          })
        );

        // Reset login attempts on successful login
        dispatch(resetLoginAttempts());

        // Flush persistence to ensure login data is immediately saved
        await storeUtils.flushPersistence();

        // Reset loading state on success
        dispatch(setLoading(false));

        console.log('✅ Login successful and persisted');
      } catch (error: any) {
        dispatch(setLoading(false));

        // Increment login attempts on failure
        dispatch(incrementLoginAttempts());

        // Set error message
        const errorMessage =
          error.data?.message || error.message || 'Login failed';
        dispatch(setError(errorMessage));

        throw new Error(errorMessage);
      }
    },
    [dispatch, loginMutation, isAccountLocked]
  );

  /**
   * Enhanced logout function with proper persistence cleanup
   */
  const logout = useCallback(async () => {
    try {
      dispatch(setLoading(true));

      // Try to call logout API (best effort)
      try {
        await logoutMutation().unwrap();
      } catch (error) {
        console.warn(
          'Logout API call failed, proceeding with local logout:',
          error
        );
      }

      // Clear auth state and persistence
      await storeUtils.resetAuth();

      // Dispatch logout action to update state
      dispatch(logoutAction());

      // Reset loading state on success
      dispatch(setLoading(false));

      console.log('✅ Logout completed with persistence cleanup');
    } catch (error) {
      console.error('❌ Logout failed:', error);

      // Fallback: force logout even if cleanup fails
      dispatch(logoutAction());
      dispatch(setLoading(false));
      try {
        await storeUtils.resetAuth();
      } catch (cleanupError) {
        console.error('❌ Persistence cleanup failed:', cleanupError);
      }
    }
  }, [dispatch, logoutMutation]);

  /**
   * Enhanced refresh token function with persistence handling
   */
  const refreshToken = useCallback(async () => {
    try {
      const result = await refreshTokenMutation().unwrap();

      dispatch(
        loginAction({
          token: result.token,
          user: user!,
          ...(result.refreshToken && { refreshToken: result.refreshToken }),
          expiresAt: result.expiresAt,
        })
      );

      // Flush persistence to ensure new token is saved
      await storeUtils.flushPersistence();

      return result.token;
    } catch (error: any) {
      // If refresh fails, logout user and clear persistence
      await logout();
      throw new Error(error.message || 'Token refresh failed');
    }
  }, [dispatch, refreshTokenMutation, user, logout]);

  /**
   * Enhanced update profile function
   */
  const updateProfile = useCallback(
    async (userData: Partial<User>) => {
      try {
        const updatedUser = await updateProfileMutation(userData).unwrap();
        dispatch(updateUser(updatedUser));
        console.log('✅ Profile updated successfully');
      } catch (error: any) {
        const errorMessage =
          error.data?.message || error.message || 'Profile update failed';
        dispatch(setError(errorMessage));
        throw new Error(errorMessage);
      }
    },
    [dispatch, updateProfileMutation]
  );

  /**
   * Clear error state
   */
  const clearErrorState = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Update user activity
   */
  const updateUserActivity = useCallback(() => {
    dispatch(updateActivity());
  }, [dispatch]);

  /**
   * Show session expired warning
   */
  const showSessionExpiredWarning = useCallback(() => {
    dispatch(showSessionWarning());
  }, [dispatch]);

  /**
   * Hide session expired warning
   */
  const hideSessionExpiredWarning = useCallback(() => {
    dispatch(hideSessionWarning());
  }, [dispatch]);

  /**
   * Get token time remaining
   */
  const getTokenTimeRemaining = useCallback((): number => {
    return tokenTimeRemaining;
  }, [tokenTimeRemaining]);

  /**
   * Format token expiration for display
   */
  const formatTokenExpiration = useCallback((): string => {
    if (!token) return 'No token';
    return jwtUtils.formatExpiration(token);
  }, [token]);

  /**
   * Check if token is expiring soon
   */
  const isTokenExpiringSoon = useCallback(
    (thresholdMinutes = 5): boolean => {
      return (
        tokenTimeRemaining > 0 &&
        tokenTimeRemaining <= thresholdMinutes * 60 * 1000
      );
    },
    [tokenTimeRemaining]
  );

  // Effect to handle session warnings and automatic token refresh
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const checkTokenExpiry = () => {
      const timeRemaining = getTokenTimeRemaining();
      const fiveMinutes = 5 * 60 * 1000;
      const oneMinute = 60 * 1000;

      if (timeRemaining <= 0) {
        // Token expired - logout
        console.log('🔐 Token expired - logging out');
        logout();
      } else if (timeRemaining <= oneMinute) {
        // Less than 1 minute - auto refresh
        console.log(
          '🔄 Token expiring in less than 1 minute - auto refreshing'
        );
        refreshToken().catch(() => {
          console.error('❌ Auto token refresh failed');
        });
      } else if (timeRemaining <= fiveMinutes && !sessionStatus.needsWarning) {
        // Less than 5 minutes - show warning
        console.log('⚠️ Token expiring soon - showing warning');
        showSessionExpiredWarning();
      }
    };

    // Check immediately and then every minute
    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [
    isAuthenticated,
    token,
    getTokenTimeRemaining,
    logout,
    refreshToken,
    showSessionExpiredWarning,
    sessionStatus.needsWarning,
  ]);

  // Effect to handle storage events and token validation
  useEffect(() => {
    // Handle persistence storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith('persist:') && event.newValue === null) {
        console.warn(
          'Encrypted auth storage was cleared externally, forcing logout'
        );
        dispatch(logoutAction());
      }
    };

    // Handle page visibility changes for activity tracking
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        updateUserActivity();
        // Verify token is still valid when user returns
        if (tokenVerification && !tokenVerification.valid) {
          console.warn('Token is no longer valid - logging out');
          logout();
        }
      }
    };

    // Handle page unload to ensure persistence is flushed
    const handleBeforeUnload = () => {
      if (isAuthenticated) {
        try {
          storeUtils.flushPersistence();
        } catch (error) {
          console.warn('Failed to flush persistence on page unload:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    dispatch,
    isAuthenticated,
    updateUserActivity,
    tokenVerification,
    logout,
  ]);

  // Context value
  const contextValue: AuthContextType = {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    sessionStatus,
    loginAttempts,
    isAccountLocked,

    // Actions
    login,
    logout,
    refreshToken,
    updateProfile,
    checkPermission: permissionChecker,
    checkRole: roleChecker,

    // Enhanced actions
    clearError: clearErrorState,
    updateUserActivity,
    showSessionExpiredWarning,
    hideSessionExpiredWarning,

    // Utilities
    getTokenTimeRemaining,
    formatTokenExpiration,
    isTokenExpiringSoon,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

/**
 * Enhanced hook to use auth context
 * Provides comprehensive authentication functionality
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export default as AuthProvider for backward compatibility
export default AuthProvider;
