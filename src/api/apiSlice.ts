/**
 * Enhanced API slice with territory filtering support
 * Automatically injects territory parameters for KAM users
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';
import { config } from '../config/environment';
import {
  getTerritoryQueryParams,
  getTerritoryHeaders,
} from '../utils/territory';

export const API_TAG_TYPES = [
  'Auth',
  'User',
  'Lead',
  'Quotation',
  'Commission',
  'Product',
  'Territory',
  'Document',
  'Ticket',
  'Settings',
  'AuditLog',
] as const;

export type ApiTagType = (typeof API_TAG_TYPES)[number];

/**
 * Enhanced base query with territory injection
 */
const baseQueryWithTerritoryInjection = fetchBaseQuery({
  baseUrl: config.apiBaseUrl,

  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    const token = state.auth.token;

    // Add authorization header
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    // Add territory headers for access control
    const territoryHeaders = getTerritoryHeaders(user);
    Object.entries(territoryHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // Add client info
    headers.set('X-Client-Type', 'web-portal');
    headers.set('X-Client-Version', config.version);

    return headers;
  },

  paramsSerializer: params => {
    const state = (window as any).__STORE__?.getState() as RootState;
    const user = state?.auth?.user;

    // Inject territory parameters for KAM users
    if (user && user.role === 'kam') {
      const territoryParams = getTerritoryQueryParams(user);
      const enhancedParams = { ...params, ...territoryParams };

      // Convert to URLSearchParams
      const searchParams = new URLSearchParams();
      Object.entries(enhancedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      return searchParams.toString();
    }

    // Default serialization for admin and other roles
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithTerritoryInjection,
  tagTypes: API_TAG_TYPES,

  keepUnusedDataFor: 60,
  refetchOnFocus: false,
  refetchOnReconnect: true,

  endpoints: () => ({}),
});

export const isApiSliceAction = (action: any): boolean => {
  return action.type?.startsWith('api/');
};

export const isApiFulfilledAction = (action: any): boolean => {
  return isApiSliceAction(action) && action.type.endsWith('/fulfilled');
};

export const isApiRejectedAction = (action: any): boolean => {
  return isApiSliceAction(action) && action.type.endsWith('/rejected');
};

export const isApiPendingAction = (action: any): boolean => {
  return isApiSliceAction(action) && action.type.endsWith('/pending');
};

export const {
  util: { getRunningQueriesThunk, resetApiState },
  middleware: apiMiddleware,
  reducer: apiReducer,
} = apiSlice;

export default apiSlice;
