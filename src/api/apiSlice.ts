import { createApi } from '@reduxjs/toolkit/query/react';
import { defaultBaseQuery } from './baseQuery';

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
] as const;

export type ApiTagType = (typeof API_TAG_TYPES)[number];

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: defaultBaseQuery,
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
