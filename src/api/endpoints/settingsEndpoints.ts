/**
 * Settings API endpoints using RTK Query
 * Handles system configuration management with proper caching and invalidation
 */

import { apiSlice } from '../apiSlice';
import type {
  SystemSettings,
  SettingsUpdatePayload,
  AuditQuery,
  AuditLogResponse,
  SettingsApiError,
} from '../../types/settings.types';

/**
 * Settings endpoints extension of base API
 */
export const settingsEndpoints = apiSlice.injectEndpoints({
  endpoints: builder => ({
    /**
     * Get current system settings
     */
    getSettings: builder.query<SystemSettings, void>({
      query: () => ({
        url: '/api/v1/settings',
        method: 'GET',
      }),
      providesTags: ['Settings'],
      transformResponse: (response: SystemSettings) => {
        console.log('✅ Settings loaded successfully:', {
          sessionTimeout: response.sessionTimeoutMin,
          tokenExpiry: response.tokenExpiryMin,
          featureFlagsCount: Object.keys(response.featureFlags).length,
          thresholdsCount: Object.keys(response.thresholds).length,
          lastUpdated: response.lastUpdated,
        });
        return response;
      },
      transformErrorResponse: (response: any): SettingsApiError => {
        console.error(
          '❌ Failed to load settings:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message: response.data?.message || 'Failed to load settings',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Update system settings with optimistic updates and rollback
     */
    updateSettings: builder.mutation<SystemSettings, SettingsUpdatePayload>({
      query: settingsData => ({
        url: '/api/v1/settings',
        method: 'PATCH',
        body: settingsData,
      }),
      invalidatesTags: ['Settings', 'AuditLog'],

      // Optimistic update with rollback on failure
      onQueryStarted: async (
        settingsData,
        { dispatch, queryFulfilled, getState }
      ) => {
        // Create optimistic update
        const patchResult = dispatch(
          settingsEndpoints.util.updateQueryData(
            'getSettings',
            undefined,
            draft => {
              // Apply optimistic changes
              Object.assign(draft, settingsData);
              draft.lastUpdated = new Date().toISOString();
            }
          )
        );

        try {
          const { data } = await queryFulfilled;
          console.log('✅ Settings updated successfully:', {
            updatedFields: Object.keys(settingsData),
            timestamp: data.lastUpdated,
          });
        } catch (error: any) {
          console.error('❌ Settings update failed, rolling back:', error);
          // Rollback optimistic update
          patchResult.undo();

          // Ensure we refetch to get canonical state
          dispatch(settingsEndpoints.util.invalidateTags(['Settings']));
        }
      },

      transformResponse: (response: SystemSettings) => {
        return response;
      },

      transformErrorResponse: (response: any): SettingsApiError => {
        console.error(
          '❌ Settings update error:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message: response.data?.message || 'Failed to update settings',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Get settings audit logs with pagination
     */
    getAuditLogs: builder.query<AuditLogResponse, AuditQuery>({
      query: ({
        page = 1,
        limit = 10,
        field,
        userId,
        dateFrom,
        dateTo,
      } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        if (field) params.append('field', field);
        if (userId) params.append('userId', userId);
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);

        return {
          url: `/api/v1/settings/audit?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['AuditLog'],
      transformResponse: (response: AuditLogResponse) => {
        console.log('✅ Audit logs loaded:', {
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
          logsCount: response.logs.length,
        });
        return response;
      },
      transformErrorResponse: (response: any): SettingsApiError => {
        console.error(
          '❌ Failed to load audit logs:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message: response.data?.message || 'Failed to load audit logs',
        };
      },
    }),
  }),
  overrideExisting: true,
});

/**
 * Export hooks for use in components
 */
export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetAuditLogsQuery,
} = settingsEndpoints;

/**
 * Export endpoint selectors for advanced usage
 */
export const settingsSelectors = settingsEndpoints.endpoints;

/**
 * Export endpoints for direct access
 */
export default settingsEndpoints;
