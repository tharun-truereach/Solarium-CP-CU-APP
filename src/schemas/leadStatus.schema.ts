/**
 * Lead status update validation schema
 * Validates status transitions and required fields using Yup
 */

import * as yup from 'yup';
import {
  isValidStatusTransition,
  getRequiredFieldsForTransition,
  isTerminalStatus,
} from '../utils/leadStatusMatrix';
import type { LeadStatus } from '../types/lead.types';

/**
 * Lead status update form data interface
 */
export interface LeadStatusFormData {
  status: LeadStatus;
  remarks?: string;
  followUpDate?: string;
  quotationRef?: string;
  tokenNumber?: string;
  overrideReason?: string; // For Admin/KAM overrides
  isOverride?: boolean;
}

/**
 * Create validation schema for status update
 */
export const createLeadStatusSchema = (
  currentStatus: LeadStatus,
  isAdmin: boolean = false,
  isKAM: boolean = false
) => {
  const canOverride = isAdmin || isKAM;

  return yup.object({
    status: yup
      .string()
      .required('Status is required')
      .test('valid-transition', 'Invalid status transition', function (value) {
        const { isOverride } = this.parent;

        // If override mode and user can override, allow any transition
        if (isOverride && canOverride) {
          return true;
        }

        // Otherwise, check if transition is valid according to matrix
        if (!value) return false;
        return isValidStatusTransition(currentStatus, value as LeadStatus);
      }),

    remarks: yup
      .string()
      .test('required-remarks', 'Remarks are required', function (value) {
        const { status, isOverride } = this.parent;

        if (!status) return true; // Let status validation handle this

        const requiredFields = getRequiredFieldsForTransition(
          currentStatus,
          status as LeadStatus
        );
        const isRemarksRequired = requiredFields?.remarks || isOverride;

        if (isRemarksRequired) {
          return !!value && value.trim().length >= 10;
        }

        return true;
      })
      .test(
        'min-length',
        'Remarks must be at least 10 characters',
        function (value) {
          if (!value) return true; // Optional field validation handled above
          return value.trim().length >= 10;
        }
      ),

    followUpDate: yup
      .string()
      .nullable()
      .test(
        'required-followup',
        'Follow-up date is required',
        function (value) {
          const { status } = this.parent;

          if (!status) return true;

          const requiredFields = getRequiredFieldsForTransition(
            currentStatus,
            status as LeadStatus
          );
          const isFollowUpRequired = requiredFields?.followUpDate;

          // Follow-up required for non-terminal states
          const isTargetTerminal = isTerminalStatus(status as LeadStatus);

          if (isFollowUpRequired && !isTargetTerminal) {
            return !!value;
          }

          return true;
        }
      )
      .test(
        'max-days',
        'Follow-up date cannot be more than 30 days in future',
        function (value) {
          if (!value) return true;

          const date = new Date(value);
          const today = new Date();
          const maxDate = new Date();
          maxDate.setDate(today.getDate() + 30);

          return date <= maxDate;
        }
      )
      .test(
        'not-past',
        'Follow-up date cannot be in the past',
        function (value) {
          if (!value) return true;

          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Start of today

          return date >= today;
        }
      ),

    quotationRef: yup
      .string()
      .test(
        'required-quotation',
        'Quotation reference is required',
        function (value) {
          const { status } = this.parent;

          if (!status) return true;

          const requiredFields = getRequiredFieldsForTransition(
            currentStatus,
            status as LeadStatus
          );
          const isQuotationRequired = requiredFields?.quotationRef;

          if (isQuotationRequired) {
            return !!value && value.trim().length > 0;
          }

          return true;
        }
      ),

    tokenNumber: yup
      .string()
      .test('required-token', 'Token number is required', function (value) {
        const { status } = this.parent;

        if (!status) return true;

        const requiredFields = getRequiredFieldsForTransition(
          currentStatus,
          status as LeadStatus
        );
        const isTokenRequired = requiredFields?.tokenNumber;

        if (isTokenRequired) {
          return !!value && value.trim().length > 0;
        }

        return true;
      }),

    overrideReason: yup
      .string()
      .test(
        'required-override-reason',
        'Override reason is required',
        function (value) {
          const { isOverride } = this.parent;

          if (isOverride) {
            return !!value && value.trim().length >= 10;
          }

          return true;
        }
      ),

    isOverride: yup.boolean(),
  });
};

/**
 * Default form values
 */
export const getDefaultStatusFormValues = (
  currentStatus: LeadStatus
): LeadStatusFormData => ({
  status: currentStatus,
  remarks: '',
  followUpDate: '',
  quotationRef: '',
  tokenNumber: '',
  overrideReason: '',
  isOverride: false,
});
