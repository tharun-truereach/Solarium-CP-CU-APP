/**
 * Route constants for the Solarium Web Portal
 * Centralizes all route paths for easy maintenance and type safety
 */

import type { Territory } from '../types/user.types';

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Protected routes
  DASHBOARD: '/dashboard',
  LEADS: '/leads',
  QUOTATIONS: '/quotations',
  CHANNEL_PARTNERS: '/channel-partners',
  CUSTOMERS: '/customers',
  COMMISSIONS: '/commissions',
  MASTER_DATA: '/master-data',
  SETTINGS: '/settings',
  MY_PROFILE: '/my-profile',
  NOTIFICATIONS: '/notifications',

  // Error routes
  NOT_FOUND: '/404',
  ACCESS_DENIED: '/403',
  SERVER_ERROR: '/500',
  SESSION_EXPIRED: '/session-expired',

  // Wildcard for 404
  WILDCARD: '*',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

/**
 * Enhanced route metadata for navigation, breadcrumbs, and access control
 */
export interface RouteInfo {
  path: string;
  title: string;
  requiresAuth: boolean;
  allowedRoles?: string[];
  requiredTerritories?: Territory[]; // NEW: Territory-based access control
  showInNavigation?: boolean;
  icon?: string;
  description?: string;
}

export const ROUTE_INFO: Record<string, RouteInfo> = {
  [ROUTES.HOME]: {
    path: ROUTES.HOME,
    title: 'Home',
    requiresAuth: false,
    showInNavigation: false,
    description: 'Home page redirect',
  },
  [ROUTES.LOGIN]: {
    path: ROUTES.LOGIN,
    title: 'Login',
    requiresAuth: false,
    showInNavigation: false,
    description: 'User authentication page',
  },
  [ROUTES.FORGOT_PASSWORD]: {
    path: ROUTES.FORGOT_PASSWORD,
    title: 'Forgot Password',
    requiresAuth: false,
    showInNavigation: false,
    description: 'Password reset request page',
  },
  [ROUTES.RESET_PASSWORD]: {
    path: ROUTES.RESET_PASSWORD,
    title: 'Reset Password',
    requiresAuth: false,
    showInNavigation: false,
    description: 'Password reset confirmation page',
  },
  [ROUTES.DASHBOARD]: {
    path: ROUTES.DASHBOARD,
    title: 'Dashboard',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    showInNavigation: true,
    icon: 'Dashboard',
    description: 'Main dashboard with overview and metrics',
  },
  [ROUTES.LEADS]: {
    path: ROUTES.LEADS,
    title: 'Leads Management',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    // Note: Territory filtering applied at data level, not route level
    showInNavigation: true,
    icon: 'People',
    description: 'Lead management and tracking',
  },
  [ROUTES.QUOTATIONS]: {
    path: ROUTES.QUOTATIONS,
    title: 'Quotations',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    showInNavigation: true,
    icon: 'RequestQuote',
    description: 'Quotation management and generation',
  },
  [ROUTES.CHANNEL_PARTNERS]: {
    path: ROUTES.CHANNEL_PARTNERS,
    title: 'Channel Partners',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    showInNavigation: true,
    icon: 'Business',
    description: 'Channel partner management',
  },
  [ROUTES.CUSTOMERS]: {
    path: ROUTES.CUSTOMERS,
    title: 'Customers',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    showInNavigation: true,
    icon: 'Assignment',
    description: 'Customer management and information',
  },
  [ROUTES.COMMISSIONS]: {
    path: ROUTES.COMMISSIONS,
    title: 'Commissions',
    requiresAuth: true,
    allowedRoles: ['admin'], // Admin only
    showInNavigation: true,
    icon: 'AttachMoney',
    description: 'Commission tracking and management',
  },
  [ROUTES.MASTER_DATA]: {
    path: ROUTES.MASTER_DATA,
    title: 'Master Data',
    requiresAuth: true,
    allowedRoles: ['admin'], // Admin only
    showInNavigation: true,
    icon: 'Storage',
    description: 'System configuration and master data',
  },
  [ROUTES.SETTINGS]: {
    path: ROUTES.SETTINGS,
    title: 'Settings',
    requiresAuth: true,
    allowedRoles: ['admin'], // Admin only
    showInNavigation: true,
    icon: 'Settings',
    description: 'System settings and configuration',
  },
  [ROUTES.MY_PROFILE]: {
    path: ROUTES.MY_PROFILE,
    title: 'My Profile',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam', 'cp', 'customer'], // All authenticated users
    showInNavigation: false, // Shown in header dropdown, not sidebar
    icon: 'Person',
    description: 'User profile management and settings',
  },
  [ROUTES.NOTIFICATIONS]: {
    path: ROUTES.NOTIFICATIONS,
    title: 'Notifications',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam', 'cp', 'customer'], // All authenticated users
    showInNavigation: false, // Shown in header, not sidebar
    icon: 'Notifications',
    description: 'System notifications and alerts',
  },
  [ROUTES.SESSION_EXPIRED]: {
    path: ROUTES.SESSION_EXPIRED,
    title: 'Session Expired',
    requiresAuth: false,
    showInNavigation: false,
    description: 'Session expiration notification page',
  },
  [ROUTES.ACCESS_DENIED]: {
    path: ROUTES.ACCESS_DENIED,
    title: 'Access Denied',
    requiresAuth: false,
    showInNavigation: false,
    description: 'Access denied error page',
  },
  [ROUTES.NOT_FOUND]: {
    path: ROUTES.NOT_FOUND,
    title: 'Page Not Found',
    requiresAuth: false,
    showInNavigation: false,
    description: 'Page not found error page',
  },
  [ROUTES.SERVER_ERROR]: {
    path: ROUTES.SERVER_ERROR,
    title: 'Server Error',
    requiresAuth: false,
    showInNavigation: false,
    description: 'Server error page',
  },
};

/**
 * Get route info by path
 * @param path - Route path
 * @returns Route information or undefined
 */
export const getRouteInfo = (path: string): RouteInfo | undefined => {
  return ROUTE_INFO[path];
};

/**
 * Get all routes that should show in navigation
 * @returns Array of route info for navigation items
 */
export const getNavigationRoutes = (): RouteInfo[] => {
  return Object.values(ROUTE_INFO).filter(route => route.showInNavigation);
};

/**
 * Get routes accessible by specific role
 * @param role - User role
 * @returns Array of route info accessible by the role
 */
export const getRoutesByRole = (role: string): RouteInfo[] => {
  return Object.values(ROUTE_INFO).filter(
    route => !route.allowedRoles || route.allowedRoles.includes(role)
  );
};

/**
 * Check if route is accessible by role
 * @param path - Route path
 * @param role - User role
 * @returns True if route is accessible
 */
export const isRouteAccessibleByRole = (
  path: string,
  role: string
): boolean => {
  const routeInfo = getRouteInfo(path);
  if (!routeInfo) return false;
  if (!routeInfo.allowedRoles) return true;
  return routeInfo.allowedRoles.includes(role);
};

/**
 * Check if route requires authentication
 * @param path - Route path
 * @returns True if route requires authentication
 */
export const routeRequiresAuth = (path: string): boolean => {
  const routeInfo = getRouteInfo(path);
  return routeInfo?.requiresAuth ?? false;
};
