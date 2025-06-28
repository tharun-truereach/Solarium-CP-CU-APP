/**
 * Error Report Modal Component
 * Displays detailed import errors with row-by-row breakdown
 */

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import AppModal from '../ui/AppModal';
import AppButton from '../ui/AppButton';
import type { LeadImportError } from '../../types/lead.types';

/**
 * Error report modal props
 */
export interface ErrorReportModalProps {
  open: boolean;
  onClose: () => void;
  errors: LeadImportError[];
  totalRows: number;
}

/**
 * Error Report Modal Component
 */
export const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  open,
  onClose,
  errors,
  totalRows,
}) => {
  /**
   * Download error report as CSV
   */
  const downloadErrorReport = () => {
    const csvContent = [
      ['Row', 'Field', 'Value', 'Error Message'].join(','),
      ...errors.map(error =>
        [
          error.row,
          error.field,
          `"${error.value || ''}"`,
          `"${error.message}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `import-errors-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Group errors by field
   */
  const errorsByField = errors.reduce(
    (acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field]!.push(error);
      return acc;
    },
    {} as Record<string, LeadImportError[]>
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Import Error Report"
      maxWidth="lg"
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <AppButton
            variant="outline"
            onClick={downloadErrorReport}
            icon={<DownloadIcon />}
          >
            Download Report
          </AppButton>
          <AppButton variant="primary" onClick={onClose}>
            Close
          </AppButton>
        </Box>
      }
    >
      <Box sx={{ minHeight: 500 }}>
        {/* Summary */}
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Import Failed - Validation Errors Found
          </Typography>
          <Typography variant="body2">
            Found {errors.length} validation errors across {totalRows} rows. All
            errors must be fixed before the import can proceed.
          </Typography>
        </Alert>

        {/* Error Summary by Field */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Error Summary by Field
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(errorsByField).map(([field, fieldErrors]) => (
              <Chip
                key={field}
                label={`${field}: ${fieldErrors.length} errors`}
                color="error"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Detailed Error Table */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Detailed Error Report
        </Typography>

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Row</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Invalid Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Error Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.map((error, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" fontSize="small" />
                      {error.row}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={error.field}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={String(error.value || '')}
                    >
                      {error.value || '(empty)'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error">
                      {error.message}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Instructions */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            How to Fix These Errors:
          </Typography>
          <Typography variant="body2">
            1. Download the error report above to see all errors in a
            spreadsheet
            <br />
            2. Fix the errors in your original CSV file
            <br />
            3. Re-upload the corrected CSV file
            <br />
            4. Remember: All rows must be valid for the import to succeed
            (all-or-nothing)
          </Typography>
        </Alert>
      </Box>
    </AppModal>
  );
};

export default ErrorReportModal;
