/**
 * Lead type definitions for Solarium Web Portal
 * Defines lead-related interfaces and types with territory support
 */

import type { Territory } from './user.types';

/**
 * Lead status types following the defined matrix
 */
export type LeadStatus =
  | 'New Lead'
  | 'In Discussion'
  | 'Physical Meeting Assigned'
  | 'Customer Accepted'
  | 'Won'
  | 'Pending at Solarium'
  | 'Under Execution'
  | 'Executed'
  | 'Not Responding'
  | 'Not Interested'
  | 'Other Territory';

/**
 * Lead origin types
 */
export type LeadOrigin = 'CP' | 'Customer' | 'Admin' | 'KAM';

/**
 * Lead source types
 */
export type LeadSource =
  | 'website'
  | 'referral'
  | 'cold_call'
  | 'social_media'
  | 'advertisement'
  | 'trade_show'
  | 'partner';

/**
 * Individual lead interface
 */
export interface Lead {
  id: string;
  leadId: string; // LEAD-XXXX format
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  state: string;
  pinCode: string;
  territory?: Territory;

  // Status and workflow
  status: LeadStatus;
  origin: LeadOrigin;
  source?: LeadSource;

  // Tracking fields
  assignedTo?: string; // CP ID
  assignedCpName?: string; // CP Name for display
  createdBy: string;
  createdByName?: string;

  // Follow-up and remarks
  followUpDate?: string;
  remarks?: string;

  // Referenced data
  quotationRef?: string; // Required when status is Won
  tokenNumber?: string; // Required when status is Under Execution

  // Services and requirements
  services?: string[];
  requirements?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Document count (derived)
  documentCount?: number;

  // Quotation summary (derived)
  quotationCount?: number;
  hasActiveQuotation?: boolean;
}

/**
 * Lead list query parameters with territory filtering
 */
export interface LeadQuery {
  // Pagination
  offset?: number;
  limit?: number;

  // Filtering
  status?: LeadStatus;
  origin?: LeadOrigin;
  source?: LeadSource;
  assignedCP?: string;
  territory?: Territory;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
  followUpDateFrom?: string;
  followUpDateTo?: string;

  // Search
  search?: string; // Search in name, phone, email
  customerName?: string;
  customerPhone?: string;

  // Sorting
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'followUpDate'
    | 'customerName'
    | 'status';
  sortOrder?: 'asc' | 'desc';

  // Territory filtering (auto-injected for KAM)
  territories?: Territory[];
}

/**
 * Lead list response
 */
export interface LeadListResponse {
  success: boolean;
  data: {
    items: Lead[];
    total: number;
    offset: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Lead creation payload
 */
export interface LeadCreatePayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  state: string;
  pinCode: string;
  services?: string[];
  requirements?: string;
  assignedTo?: string; // CP ID for Admin/KAM assignment
  source?: LeadSource;
  followUpDate?: string;
  remarks?: string;
}

/**
 * Lead update payload
 */
export interface LeadUpdatePayload {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  address?: string;
  state?: string;
  pinCode?: string;
  services?: string[];
  requirements?: string;
  followUpDate?: string;
  remarks?: string;
}

/**
 * Lead status update payload
 */
export interface LeadStatusUpdatePayload {
  status: LeadStatus;
  remarks?: string;
  followUpDate?: string;
  quotationRef?: string; // Required when moving to Won
  tokenNumber?: string; // Required when moving to Under Execution
}

/**
 * Lead reassignment payload
 */
export interface LeadReassignPayload {
  cpId: string;
  reason?: string;
}

/**
 * Lead timeline item
 */
export interface LeadTimelineItem {
  id: string;
  leadId: string;
  action: string;
  actor: string;
  actorName?: string;
  timestamp: string;
  details: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    [key: string]: any;
  };
}

/**
 * Lead timeline response
 */
export interface LeadTimelineResponse {
  success: boolean;
  data: {
    timeline: LeadTimelineItem[];
    total: number;
    leadId: string;
  };
}

/**
 * Lead API error response
 */
export interface LeadApiError {
  status: number;
  message: string;
  field?: string;
  validationErrors?: Record<string, string[]>;
}
