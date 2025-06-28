/**
 * Lead Status Matrix
 * Defines valid status transitions and required fields for each transition
 */

import type { LeadStatus } from '../types/lead.types';

/**
 * Status transition rule interface
 */
export interface StatusTransitionRule {
  from: LeadStatus;
  to: LeadStatus[];
  requiredFields?: {
    remarks?: boolean;
    followUpDate?: boolean;
    quotationRef?: boolean;
    tokenNumber?: boolean;
  };
  description?: string;
}

/**
 * Lead status matrix - defines all valid transitions
 */
export const LEAD_STATUS_MATRIX: StatusTransitionRule[] = [
  {
    from: 'New Lead',
    to: [
      'In Discussion',
      'Physical Meeting Assigned',
      'Not Responding',
      'Not Interested',
      'Other Territory',
    ],
    requiredFields: {
      remarks: true,
      followUpDate: true, // Required for non-terminal states
    },
  },
  {
    from: 'In Discussion',
    to: [
      'Physical Meeting Assigned',
      'Won',
      'Not Responding',
      'Not Interested',
      'Other Territory',
    ],
    requiredFields: {
      remarks: true,
      followUpDate: true, // Required for non-terminal states except Won
    },
  },
  {
    from: 'Physical Meeting Assigned',
    to: ['Won', 'Not Responding', 'Not Interested', 'Other Territory'],
    requiredFields: {
      remarks: true,
      followUpDate: true, // Required for non-terminal states except Won
    },
  },
  {
    from: 'Customer Accepted',
    to: ['Won'], // Customer accepted can only go to Won
    requiredFields: {
      remarks: true,
      quotationRef: true, // Required when moving to Won
    },
  },
  {
    from: 'Won',
    to: ['Pending at Solarium'],
    requiredFields: {
      remarks: true,
      quotationRef: true, // Must be set when Won
    },
  },
  {
    from: 'Pending at Solarium',
    to: ['Under Execution'],
    requiredFields: {
      remarks: true,
    },
  },
  {
    from: 'Under Execution',
    to: ['Executed'],
    requiredFields: {
      remarks: true,
      tokenNumber: true, // Required when moving to Executed
    },
  },
  // Terminal states - no transitions allowed
  {
    from: 'Executed',
    to: [],
    description: 'Terminal state - no further transitions allowed',
  },
  {
    from: 'Not Responding',
    to: [],
    description: 'Terminal state - no further transitions allowed',
  },
  {
    from: 'Not Interested',
    to: [],
    description: 'Terminal state - no further transitions allowed',
  },
  {
    from: 'Other Territory',
    to: [],
    description: 'Terminal state - no further transitions allowed',
  },
];

/**
 * Get valid next states for a given current status
 */
export const getValidNextStates = (currentStatus: LeadStatus): LeadStatus[] => {
  const rule = LEAD_STATUS_MATRIX.find(rule => rule.from === currentStatus);
  return rule?.to || [];
};

/**
 * Check if a status transition is valid
 */
export const isValidStatusTransition = (
  from: LeadStatus,
  to: LeadStatus
): boolean => {
  const validStates = getValidNextStates(from);
  return validStates.includes(to);
};

/**
 * Get required fields for a status transition
 */
export const getRequiredFieldsForTransition = (
  from: LeadStatus,
  to: LeadStatus
): StatusTransitionRule['requiredFields'] | undefined => {
  if (!isValidStatusTransition(from, to)) {
    return undefined;
  }

  const rule = LEAD_STATUS_MATRIX.find(rule => rule.from === from);
  return rule?.requiredFields;
};

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export const isTerminalStatus = (status: LeadStatus): boolean => {
  const validNextStates = getValidNextStates(status);
  return validNextStates.length === 0;
};

/**
 * Get all possible lead statuses
 */
export const getAllLeadStatuses = (): LeadStatus[] => {
  const allStatuses = new Set<LeadStatus>();

  LEAD_STATUS_MATRIX.forEach(rule => {
    allStatuses.add(rule.from);
    rule.to.forEach(status => allStatuses.add(status));
  });

  return Array.from(allStatuses);
};

/**
 * Status matrix utilities
 */
export const statusMatrix = {
  getValidNextStates,
  isValidStatusTransition,
  getRequiredFieldsForTransition,
  isTerminalStatus,
  getAllLeadStatuses,
};

export default statusMatrix;
