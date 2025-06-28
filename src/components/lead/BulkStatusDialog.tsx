/**
 * Bulk Status Dialog Component
 * Allows updating status of multiple leads with validation
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useBulkUpdateLeadsMutation } from '../../api/endpoints/leadEndpoints';
import { useToast } from '../../hooks/useToast';
import { LEAD_CONFIG } from '../../utils/constants';
import { ResultDialog } from './ResultDialog';
import type { LeadStatus, BulkOperationItem } from '../../types/lead.types';

/**
 * Component props
 */
export interface BulkStatusDialogProps {
  open: boolean;
  onClose: () => void;
  selectedLeadIds: string[];
  onSuccess: (successCount: number) => void;
}

/**
 * Available status options for bulk update
 */
const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'In Discussion', label: 'In Discussion' },
  { value: 'Physical Meeting Assigned', label: 'Physical Meeting Assigned' },
  { value: 'Won', label: 'Won' },
  { value: 'Not Responding', label: 'Not Responding' },
  { value: 'Not Interested', label: 'Not Interested' },
];

/**
 * Form validation schema
 */
const validationSchema = Yup.object({
  status: Yup.string().required('Status is required'),
  remarks: Yup.string()
    .min(10, 'Remarks must be at least 10 characters')
    .required('Remarks are required for bulk updates'),
  followUpDate: Yup.date().nullable(),
  quotationRef: Yup.string().when('status', {
    is: 'Won',
    then: schema =>
      schema.required('Quotation reference is required for Won status'),
    otherwise: schema => schema.nullable(),
  }),
});

/**
 * Bulk Status Dialog Component
 */
export const BulkStatusDialog: React.FC<BulkStatusDialogProps> = ({
  open,
  onClose,
  selectedLeadIds,
  onSuccess,
}) => {
  const [bulkUpdate, { isLoading }] = useBulkUpdateLeadsMutation();
  const { showError } = useToast();
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    data: {
      successful: number;
      failed: number;
      total: number;
      results: BulkOperationItem[];
    };
    success: boolean;
  } | null>(null);

  // Form handling
  const formik = useFormik({
    initialValues: {
      status: '' as LeadStatus,
      remarks: '',
      followUpDate: null as Date | null,
      quotationRef: '',
    },
    validationSchema,
    onSubmit: async values => {
      try {
        const updateData = {
          status: values.status,
          remarks: values.remarks,
          ...(values.followUpDate && {
            followUpDate: values.followUpDate.toISOString().split('T')[0],
          }),
          ...(values.quotationRef && { quotationRef: values.quotationRef }),
        };

        const result = await bulkUpdate({
          leadIds: selectedLeadIds,
          updates: updateData,
        }).unwrap();

        setBulkResult(result);
        setResultDialogOpen(true);

        // If all succeeded, close the dialog and notify parent
        if (result.data.failed === 0) {
          onSuccess(result.data.successful);
          handleClose();
        }
      } catch (error: any) {
        console.error('Bulk update failed:', error);
        showError(
          error.message || 'Failed to update leads. Please try again.',
          'Bulk Update Failed'
        );
      }
    },
  });

  /**
   * Handle dialog close
   */
  const handleClose = useCallback(() => {
    formik.resetForm();
    setBulkResult(null);
    setResultDialogOpen(false);
    onClose();
  }, [formik, onClose]);

  /**
   * Handle result dialog close
   */
  const handleResultDialogClose = useCallback(() => {
    setResultDialogOpen(false);
    if (bulkResult && bulkResult.data.successful > 0) {
      onSuccess(bulkResult.data.successful);
      handleClose();
    }
  }, [bulkResult, onSuccess, handleClose]);

  return (
    <>
      <Dialog
        open={open}
        onClose={isLoading ? undefined : handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle sx={{ pb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Bulk Status Update
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Update status for {selectedLeadIds.length} selected lead
                {selectedLeadIds.length !== 1 ? 's' : ''}
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
              {selectedLeadIds.length > 50 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  You have selected {selectedLeadIds.length} leads, but bulk
                  operations are limited to 50 leads at a time.
                </Alert>
              )}

              {/* Status Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  name="status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="New Status"
                  error={Boolean(formik.touched.status && formik.errors.status)}
                >
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <MenuItem key={value} value={value}>
                      {label}
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
                name="remarks"
                label="Remarks"
                placeholder="Enter reason for bulk status change (minimum 10 characters)"
                multiline
                rows={3}
                value={formik.values.remarks}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.remarks && formik.errors.remarks)}
                helperText={
                  formik.touched.remarks && formik.errors.remarks
                    ? formik.errors.remarks
                    : `${formik.values.remarks.length}/10 characters minimum`
                }
                sx={{ mb: 3 }}
              />

              {/* Follow-up Date (optional) */}
              <DatePicker
                label="Follow-up Date (Optional)"
                value={formik.values.followUpDate}
                onChange={date => formik.setFieldValue('followUpDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mb: 3 },
                  },
                }}
              />

              {/* Quotation Reference (required for Won status) */}
              {formik.values.status === 'Won' && (
                <TextField
                  fullWidth
                  name="quotationRef"
                  label="Quotation Reference"
                  placeholder="Enter quotation reference"
                  value={formik.values.quotationRef}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={Boolean(
                    formik.touched.quotationRef && formik.errors.quotationRef
                  )}
                  helperText={
                    formik.touched.quotationRef && formik.errors.quotationRef
                  }
                  required
                  sx={{ mb: 3 }}
                />
              )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button
                onClick={handleClose}
                disabled={isLoading}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || selectedLeadIds.length > 50}
                startIcon={
                  isLoading ? <CircularProgress size={20} /> : undefined
                }
              >
                {isLoading
                  ? 'Updating...'
                  : `Update ${selectedLeadIds.length} Leads`}
              </Button>
            </DialogActions>
          </form>
        </LocalizationProvider>
      </Dialog>

      {/* Result Dialog */}
      {bulkResult && (
        <ResultDialog
          open={resultDialogOpen}
          onClose={handleResultDialogClose}
          title="Bulk Update Results"
          successCount={bulkResult.data.successful}
          failedItems={bulkResult.data.results.map(item => ({
            id: item.id,
            reason: item.error || 'Unknown error',
          }))}
          operation="updated"
        />
      )}
    </>
  );
};

export default BulkStatusDialog;
