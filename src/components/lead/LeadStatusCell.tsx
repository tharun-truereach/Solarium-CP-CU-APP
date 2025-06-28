/**
 * Lead Status Cell Component
 * Inline status editor with dropdown, validation, and optimistic updates
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import { useUpdateLeadStatusMutation } from '../../api/endpoints/leadEndpoints';
import { useLeadAccess } from '../../hooks/useLeadAccess';
import {
  getValidNextStates,
  getRequiredFieldsForTransition,
  isTerminalStatus,
} from '../../utils/leadStatusMatrix';
import {
  createLeadStatusSchema,
  getDefaultStatusFormValues,
  type LeadStatusFormData,
} from '../../schemas/leadStatus.schema';
import type { Lead, LeadStatus } from '../../types/lead.types';

/**
 * Component props interface
 */
export interface LeadStatusCellProps {
  lead: Lead;
  onStatusUpdated?: (updatedLead: Lead) => void;
  disabled?: boolean;
}

/**
 * Get status color helper (move to utils if not already there)
 */
const getStatusColorLocal = (
  status: string
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' => {
  switch (status) {
    case 'New Lead':
      return 'info';
    case 'In Discussion':
      return 'primary';
    case 'Physical Meeting Assigned':
      return 'secondary';
    case 'Customer Accepted':
      return 'success';
    case 'Won':
      return 'success';
    case 'Pending at Solarium':
      return 'warning';
    case 'Under Execution':
      return 'warning';
    case 'Executed':
      return 'success';
    case 'Not Responding':
      return 'error';
    case 'Not Interested':
      return 'error';
    case 'Other Territory':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Lead Status Cell Component
 */
export const LeadStatusCell: React.FC<LeadStatusCellProps> = ({
  lead,
  onStatusUpdated,
  disabled = false,
}) => {
  const { canPerformAction, isAdmin, isKAM } = useLeadAccess();
  const [updateLeadStatus, { isLoading }] = useUpdateLeadStatusMutation();

  // Local state
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOpen = Boolean(anchorEl);
  const canEdit = canPerformAction('write', lead).hasAccess && !disabled;
  const canOverride = (isAdmin || isKAM) && !disabled;

  // Get valid next states
  const validNextStates = getValidNextStates(lead.status);
  const isCurrentTerminal = isTerminalStatus(lead.status);

  // Form validation schema
  const validationSchema = createLeadStatusSchema(lead.status, isAdmin, isKAM);

  // Form management
  const formik = useFormik<LeadStatusFormData>({
    initialValues: getDefaultStatusFormValues(lead.status),
    validationSchema,
    onSubmit: async values => {
      try {
        setError(null);

        const updateData = {
          status: values.status,
          remarks: values.remarks || '',
          ...(values.followUpDate && { followUpDate: values.followUpDate }),
          ...(values.quotationRef && { quotationRef: values.quotationRef }),
          ...(values.tokenNumber && { tokenNumber: values.tokenNumber }),
        };

        const result = await updateLeadStatus({
          leadId: lead.id,
          data: updateData,
        }).unwrap();

        // Success - close popover and notify parent
        handleClose();
        onStatusUpdated?.(result);
      } catch (error: any) {
        console.error('Failed to update lead status:', error);
        setError(error?.data?.message || 'Failed to update status');
      }
    },
  });

  /**
   * Handle opening the status editor
   */
  const handleOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!canEdit) return;

      setAnchorEl(event.currentTarget);
      setError(null);

      // Reset form to current values
      formik.resetForm({
        values: {
          ...getDefaultStatusFormValues(lead.status),
          quotationRef: lead.quotationRef || '',
          tokenNumber: lead.tokenNumber || '',
        },
      });
    },
    [canEdit, lead.status, lead.quotationRef, lead.tokenNumber, formik]
  );

  /**
   * Handle closing the popover
   */
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setError(null);
    formik.resetForm();
  }, [formik]);

  /**
   * Handle status change
   */
  const handleStatusChange = useCallback(
    (newStatus: LeadStatus) => {
      formik.setFieldValue('status', newStatus);

      // Clear override mode when selecting a valid transition
      if (getValidNextStates(lead.status).includes(newStatus)) {
        formik.setFieldValue('isOverride', false);
        formik.setFieldValue('overrideReason', '');
      }
    },
    [formik, lead.status]
  );

  /**
   * Handle override toggle
   */
  const handleOverrideToggle = useCallback(
    (checked: boolean) => {
      formik.setFieldValue('isOverride', checked);

      if (!checked) {
        formik.setFieldValue('overrideReason', '');
        // Reset status to current if invalid transition
        if (!getValidNextStates(lead.status).includes(formik.values.status)) {
          formik.setFieldValue('status', lead.status);
        }
      }
    },
    [formik, lead.status]
  );

  // Determine which statuses to show in dropdown
  const availableStatuses =
    formik.values.isOverride && canOverride
      ? ([
          'New Lead',
          'In Discussion',
          'Physical Meeting Assigned',
          'Customer Accepted',
          'Won',
          'Pending at Solarium',
          'Under Execution',
          'Executed',
          'Not Responding',
          'Not Interested',
          'Other Territory',
        ] as LeadStatus[])
      : validNextStates;

  // Get required fields for current transition
  const requiredFields = getRequiredFieldsForTransition(
    lead.status,
    formik.values.status
  );
  const targetIsTerminal = isTerminalStatus(formik.values.status);

  return (
    <>
      {/* Status Display/Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={lead.status}
          size="small"
          color={getStatusColorLocal(lead.status)}
          variant="filled"
          sx={{ fontWeight: 500 }}
        />

        {canEdit && (
          <Tooltip
            title={
              isCurrentTerminal
                ? 'Terminal status - no changes allowed'
                : 'Edit status'
            }
          >
            <span>
              <IconButton
                size="small"
                onClick={handleOpen}
                disabled={isCurrentTerminal || isLoading}
                sx={{ ml: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Status Editor Popover */}
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 2,
            minWidth: 400,
            maxWidth: 500,
          },
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <form onSubmit={formik.handleSubmit}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Update Lead Status
            </Typography>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Current Status Info */}
            <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Current Status: <strong>{lead.status}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lead ID: <strong>{lead.leadId}</strong>
              </Typography>
            </Box>

            {/* Override Checkbox */}
            {canOverride && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.isOverride}
                    onChange={e => handleOverrideToggle(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon fontSize="small" color="warning" />
                    <Typography variant="body2">
                      Override Status Matrix (Admin/KAM)
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2 }}
              />
            )}

            {/* Status Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>New Status</InputLabel>
              <Select
                value={formik.values.status}
                onChange={e => handleStatusChange(e.target.value as LeadStatus)}
                label="New Status"
                error={Boolean(formik.touched.status && formik.errors.status)}
              >
                {availableStatuses.map(status => (
                  <MenuItem key={status} value={status}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={status}
                        size="small"
                        color={getStatusColorLocal(status)}
                        variant="outlined"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.status && formik.errors.status && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {formik.errors.status}
                </Typography>
              )}
            </FormControl>

            {/* Remarks */}
            <TextField
              fullWidth
              label="Remarks"
              placeholder="Enter reason for status change (minimum 10 characters)"
              multiline
              rows={3}
              value={formik.values.remarks}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="remarks"
              error={Boolean(formik.touched.remarks && formik.errors.remarks)}
              helperText={
                formik.touched.remarks && formik.errors.remarks
                  ? formik.errors.remarks
                  : `${formik.values.remarks?.length || 0}/10 characters minimum`
              }
              required={Boolean(
                requiredFields?.remarks || formik.values.isOverride
              )}
              sx={{ mb: 2 }}
            />

            {/* Follow-up Date */}
            {requiredFields?.followUpDate && !targetIsTerminal && (
              <DatePicker
                label="Follow-up Date"
                value={
                  formik.values.followUpDate
                    ? new Date(formik.values.followUpDate)
                    : null
                }
                onChange={date =>
                  formik.setFieldValue(
                    'followUpDate',
                    date ? date.toISOString().split('T')[0] : ''
                  )
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(
                      formik.touched.followUpDate && formik.errors.followUpDate
                    ),
                    helperText:
                      formik.touched.followUpDate && formik.errors.followUpDate,
                    sx: { mb: 2 },
                  },
                }}
              />
            )}

            {/* Quotation Reference */}
            {requiredFields?.quotationRef && (
              <TextField
                fullWidth
                label="Quotation Reference"
                placeholder="Select quotation reference"
                value={formik.values.quotationRef}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="quotationRef"
                error={Boolean(
                  formik.touched.quotationRef && formik.errors.quotationRef
                )}
                helperText={
                  formik.touched.quotationRef && formik.errors.quotationRef
                }
                required
                sx={{ mb: 2 }}
              />
            )}

            {/* Token Number */}
            {requiredFields?.tokenNumber && (
              <TextField
                fullWidth
                label="Token Number"
                placeholder="Enter execution token number"
                value={formik.values.tokenNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="tokenNumber"
                error={Boolean(
                  formik.touched.tokenNumber && formik.errors.tokenNumber
                )}
                helperText={
                  formik.touched.tokenNumber && formik.errors.tokenNumber
                }
                required
                sx={{ mb: 2 }}
              />
            )}

            {/* Override Reason */}
            {formik.values.isOverride && (
              <TextField
                fullWidth
                label="Override Reason"
                placeholder="Explain why you are overriding the normal status flow (minimum 10 characters)"
                multiline
                rows={2}
                value={formik.values.overrideReason}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="overrideReason"
                error={Boolean(
                  formik.touched.overrideReason && formik.errors.overrideReason
                )}
                helperText={
                  formik.touched.overrideReason && formik.errors.overrideReason
                }
                required
                sx={{ mb: 2 }}
              />
            )}

            <Divider sx={{ my: 2 }} />

            {/* Actions */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || !formik.isValid}
                startIcon={isLoading ? undefined : <SaveIcon />}
              >
                {isLoading ? 'Updating...' : 'Update Status'}
              </Button>
            </Stack>
          </form>
        </LocalizationProvider>
      </Popover>
    </>
  );
};

export default LeadStatusCell;
