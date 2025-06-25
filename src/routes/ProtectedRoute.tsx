/**
 * Enhanced ProtectedRoute component for handling authentication and authorization
 * Supports both role-based and territory-based access control
 * Redirects to appropriate error pages based on access violation type
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateRouteAccess } from '../utils/territory';
import { ROUTES } from './routes';
import type { Territory } from '../types/user.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredTerritories?: Territory[];
  redirectTo?: string;
  checkPermission?: (user: any, pathname: string) => boolean;
}

/**
 * Enhanced ProtectedRoute component with territory-based access control
 *
 * Access Control Hierarchy:
 * 1. Authentication required
 * 2. Role-based access (if specified)
 * 3. Territory-based access (if specified)
 * 4. Custom permission check (if provided)
 *
 * @param children - Components to render if access is granted
 * @param requiredRoles - Array of roles that can access this route
 * @param requiredTerritories - Array of territories required for access
 * @param redirectTo - Custom redirect path for unauthenticated users
 * @param checkPermission - Custom permission check function
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredTerritories = [],
  redirectTo = ROUTES.LOGIN,
  checkPermission,
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to login with return path
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If no user data available, redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Special handling for routes accessible to all authenticated users
  const publicAuthenticatedRoutes = [ROUTES.MY_PROFILE, ROUTES.NOTIFICATIONS];

  // If this is a public authenticated route, allow access for any authenticated user
  if (publicAuthenticatedRoutes.includes(location.pathname as any)) {
    console.log(
      `✅ Allowing access to public authenticated route: ${location.pathname} for user: ${user.email}`
    );
    return <>{children}</>;
  }

  // For other routes, validate using existing logic
  const accessValidation = validateRouteAccess(
    user,
    requiredTerritories,
    requiredRoles
  );

  if (!accessValidation.hasAccess) {
    // Log access attempt for security monitoring
    console.warn(
      `Access denied for user ${user.email} to ${location.pathname}`,
      {
        reason: accessValidation.reason,
        userRole: user.role,
        userTerritories: user.territories,
        requiredRoles,
        requiredTerritories,
        timestamp: new Date().toISOString(),
      }
    );

    // Redirect to access denied page
    return <Navigate to={ROUTES.ACCESS_DENIED} replace />;
  }

  // Check additional custom permissions if provided
  if (checkPermission && !checkPermission(user, location.pathname)) {
    console.warn(
      `Custom permission check failed for user ${user.email} to ${location.pathname}`,
      {
        userRole: user.role,
        userTerritories: user.territories,
        timestamp: new Date().toISOString(),
      }
    );

    return <Navigate to={ROUTES.ACCESS_DENIED} replace />;
  }

  // Access granted - render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
