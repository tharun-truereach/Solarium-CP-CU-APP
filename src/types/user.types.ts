/**
 * User type definitions for Solarium Web Portal
 * Defines user-related interfaces and types with territory support
 */

/**
 * User role types
 */
export type UserRole = 'admin' | 'kam' | 'cp' | 'customer';

/**
 * User permission types
 */
export type Permission =
  | 'leads:read'
  | 'leads:write'
  | 'leads:delete'
  | 'quotations:read'
  | 'quotations:write'
  | 'quotations:approve'
  | 'commissions:read'
  | 'commissions:write'
  | 'commissions:approve'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'master-data:read'
  | 'master-data:write'
  | 'reports:read'
  | 'reports:advanced'
  | 'settings:read'
  | 'settings:write';

/**
 * Territory types
 */
export type Territory =
  | 'North'
  | 'South'
  | 'East'
  | 'West'
  | 'Central'
  | 'Northeast'
  | 'Northwest'
  | 'Southeast'
  | 'Southwest';

/**
 * User profile interface with territory support
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];

  // Profile information
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;

  // Work information with territory support
  department?: string;
  territories: Territory[]; // Array of assigned territories
  manager?: string;

  // Account status
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;

  // Preferences (optional, can be moved to separate interface)
  timezone?: string;
  language?: string;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response interface
 */
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

/**
 * Token refresh response interface
 */
export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

/**
 * User creation/update payload with territory support
 */
export interface UserPayload {
  email: string;
  name: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  department?: string;
  territories?: Territory[]; // Array of assigned territories
  permissions?: Permission[];
  isActive?: boolean;
}

/**
 * Password change payload
 */
export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * User profile update payload
 */
export interface ProfileUpdatePayload {
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
}

/**
 * User list query parameters with territory filtering
 */
export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  territories?: Territory[];
  isActive?: boolean;
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * User list response interface
 */
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Territory access interface for data filtering
 */
export interface TerritoryAccess {
  territories: Territory[];
  hasFullAccess: boolean; // Admin has access to all territories
  canAccessTerritory: (territory: Territory) => boolean;
}

/**
 * Territory-filtered query parameters for data APIs
 */
export interface TerritoryFilteredQuery {
  territories?: Territory[];
  territoryFilter?: 'include' | 'exclude';
}

/**
 * Extended data query with territory filtering
 */
export interface DataQueryWithTerritory extends TerritoryFilteredQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}
