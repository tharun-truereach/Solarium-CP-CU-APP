/**
 * Lead API endpoints using RTK Query
 * Handles lead CRUD operations, status updates, reassignment, and timeline
 * Includes automatic territory filtering for KAM users via baseQueryWithTerritoryInjection
 */

import { apiSlice } from '../apiSlice';
import type {
  LeadQuery,
  LeadListResponse,
  Lead,
  LeadCreatePayload,
  LeadUpdatePayload,
  LeadStatusUpdatePayload,
  LeadReassignPayload,
  LeadTimelineResponse,
  LeadApiError,
} from '../../types/lead.types';

/**
 * Lead endpoints extension of base API
 */
export const leadEndpoints = apiSlice.injectEndpoints({
  endpoints: builder => ({
    /**
     * Get leads with filtering, pagination, and territory-based access control
     * Territory filtering is automatically applied by baseQueryWithTerritoryInjection for KAM users
     */
    getLeads: builder.query<LeadListResponse, LeadQuery>({
      query: ({
        offset = 0,
        limit = 25,
        status,
        origin,
        source,
        assignedCP,
        territory,
        state,
        dateFrom,
        dateTo,
        followUpDateFrom,
        followUpDateTo,
        search,
        customerName,
        customerPhone,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = {}) => {
        // Build parameters object - territory filtering will be injected by baseQuery
        const params: Record<string, string> = {
          offset: offset.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
        };

        // Add optional filter parameters
        if (status) params.status = status;
        if (origin) params.origin = origin;
        if (source) params.source = source;
        if (assignedCP) params.assignedCP = assignedCP;
        if (territory) params.territory = territory;
        if (state) params.state = state;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        if (followUpDateFrom) params.followUpDateFrom = followUpDateFrom;
        if (followUpDateTo) params.followUpDateTo = followUpDateTo;
        if (search) params.search = search;
        if (customerName) params.customerName = customerName;
        if (customerPhone) params.customerPhone = customerPhone;

        return {
          url: '/api/v1/leads',
          method: 'GET',
          params, // Territory filtering will be injected here by baseQueryWithTerritoryInjection
        };
      },
      providesTags: result => [
        'Lead',
        ...(result?.data.items.map(({ id }) => ({
          type: 'Lead' as const,
          id,
        })) ?? []),
      ],
      transformResponse: (response: LeadListResponse) => {
        console.log('✅ Leads loaded:', {
          total: response.data.total,
          count: response.data.items.length,
          offset: response.data.offset,
          limit: response.data.limit,
        });
        return response;
      },
      transformErrorResponse: (response: any): LeadApiError => {
        console.error(
          '❌ Failed to load leads:',
          response.status,
          response.data?.message
        );

        // Handle 403 Forbidden responses specifically
        if (response.status === 403) {
          // Dispatch global event for 403 handling
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('api:forbidden', {
                detail: {
                  endpoint: '/api/v1/leads',
                  error: response,
                  message: response.data?.message || 'Access denied to leads',
                },
              })
            );
          }
        }

        return {
          status: response.status,
          message: response.data?.message || 'Failed to load leads',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Create a new lead
     */
    createLead: builder.mutation<Lead, LeadCreatePayload>({
      query: leadData => ({
        url: '/api/v1/leads',
        method: 'POST',
        data: leadData, // Use 'data' for POST body
      }),
      invalidatesTags: ['Lead'],
      transformResponse: (response: { success: boolean; data: Lead }) => {
        console.log('✅ Lead created:', response.data.leadId);
        return response.data;
      },
      transformErrorResponse: (response: any): LeadApiError => {
        console.error(
          '❌ Failed to create lead:',
          response.status,
          response.data?.message
        );

        // Handle 403 Forbidden responses
        if (response.status === 403) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('api:forbidden', {
                detail: {
                  endpoint: '/api/v1/leads',
                  error: response,
                  message:
                    response.data?.message || 'Access denied to create lead',
                },
              })
            );
          }
        }

        return {
          status: response.status,
          message: response.data?.message || 'Failed to create lead',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Update lead details (not status - use separate endpoint for status)
     */
    updateLead: builder.mutation<
      Lead,
      { leadId: string; data: LeadUpdatePayload }
    >({
      query: ({ leadId, data }) => ({
        url: `/api/v1/leads/${leadId}`,
        method: 'PATCH',
        data, // Use 'data' for PATCH body
      }),
      invalidatesTags: (result, error, { leadId }) => [
        'Lead',
        { type: 'Lead', id: leadId },
      ],
      transformResponse: (response: { success: boolean; data: Lead }) => {
        console.log('✅ Lead updated:', response.data.leadId);
        return response.data;
      },
      transformErrorResponse: (response: any): LeadApiError => {
        console.error(
          '❌ Failed to update lead:',
          response.status,
          response.data?.message
        );

        // Handle 403 Forbidden responses
        if (response.status === 403) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('api:forbidden', {
                detail: {
                  endpoint: '/api/v1/leads',
                  error: response,
                  message:
                    response.data?.message || 'Access denied to update lead',
                },
              })
            );
          }
        }

        return {
          status: response.status,
          message: response.data?.message || 'Failed to update lead',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Update lead status with validation and required fields
     */
    updateLeadStatus: builder.mutation<
      Lead,
      { leadId: string; data: LeadStatusUpdatePayload }
    >({
      query: ({ leadId, data }) => ({
        url: `/api/v1/leads/${leadId}/status`,
        method: 'PATCH',
        data, // Use 'data' for PATCH body
      }),
      invalidatesTags: (result, error, { leadId }) => [
        'Lead',
        { type: 'Lead', id: leadId },
      ],

      // Optimistic update for status changes
      onQueryStarted: async (
        { leadId, data },
        { dispatch, queryFulfilled }
      ) => {
        // Create optimistic update for lead list
        const patchResult = dispatch(
          leadEndpoints.util.updateQueryData('getLeads', {}, draft => {
            const leadIndex = draft.data.items.findIndex(
              lead => lead.id === leadId
            );
            if (leadIndex !== -1) {
              // Apply optimistic status change
              draft.data.items[leadIndex]!.status = data.status;
              draft.data.items[leadIndex]!.updatedAt = new Date().toISOString();
              if (data.remarks) {
                draft.data.items[leadIndex]!.remarks = data.remarks;
              }
              if (data.followUpDate) {
                draft.data.items[leadIndex]!.followUpDate = data.followUpDate;
              }
              if (data.quotationRef) {
                draft.data.items[leadIndex]!.quotationRef = data.quotationRef;
              }
              if (data.tokenNumber) {
                draft.data.items[leadIndex]!.tokenNumber = data.tokenNumber;
              }
            }
          })
        );

        try {
          const { data: updatedLead } = await queryFulfilled;
          console.log(
            '✅ Lead status updated:',
            updatedLead.leadId,
            data.status
          );
        } catch (error: any) {
          console.error('❌ Lead status update failed, rolling back:', error);
          // Rollback optimistic update
          patchResult.undo();
        }
      },

      transformResponse: (response: { success: boolean; data: Lead }) => {
        return response.data;
      },
      transformErrorResponse: (response: any): LeadApiError => {
        console.error(
          '❌ Failed to update lead status:',
          response.status,
          response.data?.message
        );

        // Handle 403 Forbidden responses
        if (response.status === 403) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('api:forbidden', {
                detail: {
                  endpoint: '/api/v1/leads/status',
                  error: response,
                  message:
                    response.data?.message ||
                    'Access denied to update lead status',
                },
              })
            );
          }
        }

        return {
          status: response.status,
          message: response.data?.message || 'Failed to update lead status',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Reassign lead to different Channel Partner
     * Only Admin and KAM can perform this action
     */
    reassignLead: builder.mutation<
      Lead,
      { leadId: string; data: LeadReassignPayload }
    >({
      query: ({ leadId, data }) => ({
        url: `/api/v1/leads/${leadId}/reassign`,
        method: 'PATCH',
        data, // Use 'data' for PATCH body
      }),
      invalidatesTags: (result, error, { leadId }) => [
        'Lead',
        { type: 'Lead', id: leadId },
      ],
      transformResponse: (response: { success: boolean; data: Lead }) => {
        console.log(
          '✅ Lead reassigned:',
          response.data.leadId,
          response.data.assignedTo
        );
        return response.data;
      },
      transformErrorResponse: (response: any): LeadApiError => {
        console.error(
          '❌ Failed to reassign lead:',
          response.status,
          response.data?.message
        );

        // Handle 403 Forbidden responses
        if (response.status === 403) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('api:forbidden', {
                detail: {
                  endpoint: '/api/v1/leads/reassign',
                  error: response,
                  message:
                    response.data?.message || 'Access denied to reassign lead',
                },
              })
            );
          }
        }

        return {
          status: response.status,
          message: response.data?.message || 'Failed to reassign lead',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Get lead timeline/audit history
     * Returns chronological list of changes and actions
     */
    getLeadTimeline: builder.query<
      LeadTimelineResponse,
      { leadId: string; limit?: number }
    >({
      query: ({ leadId, limit = 50 }) => ({
        url: `/api/v1/leads/${leadId}/timeline`,
        method: 'GET',
        params: {
          limit: limit.toString(),
        },
      }),
      providesTags: (result, error, { leadId }) => [
        'Lead',
        { type: 'Lead', id: leadId },
      ],
      transformResponse: (response: LeadTimelineResponse) => {
        console.log('✅ Lead timeline loaded:', {
          leadId: response.data.leadId,
          timelineEntries: response.data.timeline.length,
          total: response.data.total,
        });
        return response;
      },
      transformErrorResponse: (response: any): LeadApiError => {
        console.error(
          '❌ Failed to load lead timeline:',
          response.status,
          response.data?.message
        );

        // Handle 403 Forbidden responses
        if (response.status === 403) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('api:forbidden', {
                detail: {
                  endpoint: '/api/v1/leads/timeline',
                  error: response,
                  message:
                    response.data?.message || 'Access denied to lead timeline',
                },
              })
            );
          }
        }

        return {
          status: response.status,
          message: response.data?.message || 'Failed to load lead timeline',
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
  useGetLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useUpdateLeadStatusMutation,
  useReassignLeadMutation,
  useGetLeadTimelineQuery,
} = leadEndpoints;

/**
 * Export endpoint selectors for advanced usage
 */
export const leadSelectors = leadEndpoints.endpoints;

/**
 * Export endpoints for direct access
 */
export default leadEndpoints;
