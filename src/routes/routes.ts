/**
 * Route constants for the Solarium Web Portal
 * Centralizes all route paths for easy maintenance and type safety
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',

  // Protected routes
  DASHBOARD: '/dashboard',
  LEADS: '/leads',
  QUOTATIONS: '/quotations',
  CHANNEL_PARTNERS: '/channel-partners',
  CUSTOMERS: '/customers',
  COMMISSIONS: '/commissions',
  MASTER_DATA: '/master-data',
  SETTINGS: '/settings',

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
 * Route metadata for navigation and breadcrumbs
 */
export interface RouteInfo {
  path: string;
  title: string;
  requiresAuth: boolean;
  allowedRoles?: string[];
  showInNavigation?: boolean;
}

export const ROUTE_INFO: Record<string, RouteInfo> = {
  [ROUTES.HOME]: {
    path: ROUTES.HOME,
    title: 'Home',
    requiresAuth: false,
    showInNavigation: false,
  },
  [ROUTES.LOGIN]: {
    path: ROUTES.LOGIN,
    title: 'Login',
    requiresAuth: false,
    showInNavigation: false,
  },
  [ROUTES.DASHBOARD]: {
    path: ROUTES.DASHBOARD,
    title: 'Dashboard',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    showInNavigation: true,
  },
  [ROUTES.LEADS]: {
    path: ROUTES.LEADS,
    title: 'Leads Management',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    showInNavigation: true,
  },
  [ROUTES.QUOTATIONS]: {
    path: ROUTES.QUOTATIONS,
    title: 'Quotations',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    showInNavigation: true,
  },
  [ROUTES.CHANNEL_PARTNERS]: {
    path: ROUTES.CHANNEL_PARTNERS,
    title: 'Channel Partners',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    showInNavigation: true,
  },
  [ROUTES.CUSTOMERS]: {
    path: ROUTES.CUSTOMERS,
    title: 'Customers',
    requiresAuth: true,
    allowedRoles: ['admin', 'kam'],
    showInNavigation: true,
  },
  [ROUTES.COMMISSIONS]: {
    path: ROUTES.COMMISSIONS,
    title: 'Commissions',
    requiresAuth: true,
    allowedRoles: ['admin'], // Admin only
    showInNavigation: true,
  },
  [ROUTES.MASTER_DATA]: {
    path: ROUTES.MASTER_DATA,
    title: 'Master Data',
    requiresAuth: true,
    allowedRoles: ['admin'], // Admin only
    showInNavigation: true,
  },
  [ROUTES.SETTINGS]: {
    path: ROUTES.SETTINGS,
    title: 'Settings',
    requiresAuth: true,
    allowedRoles: ['admin'], // Admin only
    showInNavigation: true,
  },
  [ROUTES.SESSION_EXPIRED]: {
    path: ROUTES.SESSION_EXPIRED,
    title: 'Session Expired',
    requiresAuth: false,
    showInNavigation: false,
  },
};
