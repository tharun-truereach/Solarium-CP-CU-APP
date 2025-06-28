/**
 * Bulk Reassign Dialog Component
 * Allows reassigning multiple leads to a new owner
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
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useBulkReassignLeadsMutation } from '../../api/endpoints/leadEndpoints';
import { useToast } from '../../hooks/useToast';
import { useChannelPartners } from '../../hooks/useChannelPartners';
import { ResultDialog } from './ResultDialog';

/**
 * Component props
 */
export interface BulkReassignDialogProps {
  open: boolean;
  onClose: () => void;
  selectedLeadIds: string[];
  onSuccess: (successCount: number) => void;
}

/**
 * Form validation schema
 */
const validationSchema = Yup.object({
  assigneeId: Yup.string().required('New owner is required'),
  remarks: Yup.string()
    .min(10, 'Remarks must be at least 10 characters')
    .required('Remarks are required for bulk reassignment'),
});

/**
 * Bulk Reassign Dialog Component
 */
export const BulkReassignDialog: React.FC<BulkReassignDialogProps> = ({
  open,
  onClose,
  selectedLeadIds,
  onSuccess,
}) => {
  const [bulkReassign, { isLoading }] = useBulkReassignLeadsMutation();
  const { showError } = useToast();
  const {
    channelPartners,
    activeChannelPartners,
    isLoading: isLoadingPartners,
  } = useChannelPartners();
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    data: {
      successful: number;
      results: { id: string; error?: string }[];
    };
  } | null>(null);

  // Form handling
  const formik = useFormik({
    initialValues: {
      assigneeId: '',
      remarks: '',
    },
    validationSchema,
    onSubmit: async values => {
      try {
        const result = await bulkReassign({
          leadIds: selectedLeadIds,
          cpId: values.assigneeId,
          reason: values.remarks,
        }).unwrap();

        setBulkResult(result);
        setResultDialogOpen(true);

        // If all succeeded, close the dialog and notify parent
        if (result.data.results.length === 0) {
          onSuccess(result.data.successful);
          handleClose();
        }
      } catch (error: any) {
        console.error('Bulk reassign failed:', error);
        showError(
          error.message || 'Failed to reassign leads. Please try again.',
          'Bulk Reassign Failed'
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
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle sx={{ pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bulk Reassign Leads
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reassign {selectedLeadIds.length} selected lead
              {selectedLeadIds.length !== 1 ? 's' : ''} to a new owner
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            {selectedLeadIds.length > 50 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                You have selected {selectedLeadIds.length} leads, but bulk
                operations are limited to 50 leads at a time.
              </Alert>
            )}

            {/* New Owner Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>New Owner</InputLabel>
              <Select
                name="assigneeId"
                value={formik.values.assigneeId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="New Owner"
                error={Boolean(
                  formik.touched.assigneeId && formik.errors.assigneeId
                )}
                disabled={isLoadingPartners}
              >
                {activeChannelPartners?.map(partner => (
                  <MenuItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.assigneeId && formik.errors.assigneeId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {formik.errors.assigneeId}
                </Typography>
              )}
            </FormControl>

            {/* Remarks */}
            <TextField
              fullWidth
              name="remarks"
              label="Remarks"
              placeholder="Enter reason for bulk reassignment (minimum 10 characters)"
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
              startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
            >
              {isLoading
                ? 'Reassigning...'
                : `Reassign ${selectedLeadIds.length} Leads`}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Result Dialog */}
      {bulkResult && (
        <ResultDialog
          open={resultDialogOpen}
          onClose={handleResultDialogClose}
          title="Bulk Reassign Results"
          successCount={bulkResult.data.successful}
          failedItems={bulkResult.data.results.map(item => ({
            id: item.id,
            reason: item.error || 'Unknown error',
          }))}
          operation="reassigned"
        />
      )}
    </>
  );
};

export default BulkReassignDialog;
