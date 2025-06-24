/**
 * Enhanced API slice with territory filtering support
 * Automatically injects territory parameters for KAM users
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';
import { config } from '../config/environment';
import {
  getTerritoryQueryParams,
  getTerritoryHeaders,
} from '../utils/territory';
import { baseQueryWithReauth } from './baseQuery';

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
 * Enhanced base query wrapper with territory injection
 */
const baseQueryWithTerritoryInjection = async (
  args: any,
  api: any,
  extraOptions: any
) => {
  const state = api.getState() as RootState;
  const user = state.auth.user;

  // Add territory headers for access control
  if (user) {
    const territoryHeaders = getTerritoryHeaders(user);
    args.headers = { ...args.headers, ...territoryHeaders };
  }

  // Add client info headers
  args.headers = {
    ...args.headers,
    'X-Client-Type': 'web-portal',
    'X-Client-Version': config.version,
  };

  // Inject territory parameters for KAM users
  if (user && user.role === 'kam' && args.params) {
    const territoryParams = getTerritoryQueryParams(user);
    args.params = { ...args.params, ...territoryParams };
  }

  // Use our custom baseQuery with Axios
  return baseQueryWithReauth(args, api, extraOptions);
};

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
