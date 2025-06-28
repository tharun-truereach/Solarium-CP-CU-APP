/**
 * CSV Import Dialog Component
 * Handles CSV file upload, validation, and lead import
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  FileDownload as DownloadIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { useImportLeadsMutation } from '../../api/endpoints/leadEndpoints';
import { useToast } from '../../hooks/useToast';
import { CSVToolkit } from '../../services/csv';
import type { LeadCSVRow, CSVValidationResult } from '../../services/csv';

/**
 * Component props
 */
export interface CSVImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
}

/**
 * Import steps
 */
enum ImportStep {
  FILE_SELECT = 'file_select',
  PREVIEW = 'preview',
  IMPORTING = 'importing',
  RESULTS = 'results',
}

/**
 * CSV Import Dialog Component
 */
export const CSVImportDialog: React.FC<CSVImportDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [importLeads, { isLoading }] = useImportLeadsMutation();
  const { showSuccess, showError } = useToast();

  // State
  const [currentStep, setCurrentStep] = useState(ImportStep.FILE_SELECT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<LeadCSVRow[]>([]);
  const [validationResult, setValidationResult] =
    useState<CSVValidationResult | null>(null);
  const [importResults, setImportResults] = useState<any>(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file
      const fileError = CSVToolkit.validateFile(file);
      if (fileError) {
        showError(fileError, 'Invalid File');
        return;
      }

      try {
        setSelectedFile(file);

        // Parse CSV
        const parseResult = await CSVToolkit.parseCSV<LeadCSVRow>(file);

        if (parseResult.errors.length > 0) {
          showError(
            `CSV parsing errors: ${parseResult.errors.map(e => e.message).join(', ')}`,
            'Parsing Failed'
          );
          return;
        }

        // Validate data
        const validation = CSVToolkit.validateLeadData(parseResult.data);

        setParsedData(parseResult.data);
        setValidationResult(validation);
        setCurrentStep(ImportStep.PREVIEW);
      } catch (error: any) {
        showError(error.message || 'Failed to parse CSV file', 'Import Error');
      }
    },
    [showError]
  );

  /**
   * Handle import execution
   */
  const handleImport = useCallback(async () => {
    if (!selectedFile || !validationResult?.isValid) return;

    try {
      setCurrentStep(ImportStep.IMPORTING);

      const result = await importLeads({ file: selectedFile }).unwrap();

      setImportResults(result);
      setCurrentStep(ImportStep.RESULTS);

      if (result.data.errors.length === 0) {
        showSuccess(
          `Successfully imported ${result.data.imported} leads`,
          'Import Complete'
        );
        onSuccess(result.data.imported);
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      setCurrentStep(ImportStep.PREVIEW);
      showError(
        error.message || 'Failed to import leads. Please try again.',
        'Import Failed'
      );
    }
  }, [
    selectedFile,
    validationResult,
    importLeads,
    showSuccess,
    showError,
    onSuccess,
  ]);

  /**
   * Download CSV template
   */
  const handleDownloadTemplate = useCallback(() => {
    const template = CSVToolkit.getImportTemplate();
    CSVToolkit.downloadCSV(template, 'lead-import-template.csv');
  }, []);

  /**
   * Reset dialog state
   */
  const handleClose = useCallback(() => {
    setCurrentStep(ImportStep.FILE_SELECT);
    setSelectedFile(null);
    setParsedData([]);
    setValidationResult(null);
    setImportResults(null);
    onClose();
  }, [onClose]);

  /**
   * Go back to file selection
   */
  const handleBack = useCallback(() => {
    setCurrentStep(ImportStep.FILE_SELECT);
    setSelectedFile(null);
    setParsedData([]);
    setValidationResult(null);
  }, []);

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: 500 },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Import Leads from CSV
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentStep === ImportStep.FILE_SELECT &&
                'Select a CSV file to import leads (max 50 rows)'}
              {currentStep === ImportStep.PREVIEW &&
                'Review and validate your data before importing'}
              {currentStep === ImportStep.IMPORTING &&
                'Importing your leads...'}
              {currentStep === ImportStep.RESULTS && 'Import completed'}
            </Typography>
          </Box>

          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            variant="outlined"
            size="small"
          >
            Template
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* File Selection Step */}
        {currentStep === ImportStep.FILE_SELECT && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-file-input"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="csv-file-input">
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  p: 4,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <UploadIcon
                  sx={{ fontSize: 64, color: 'primary.main', mb: 2 }}
                />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Choose CSV File
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a CSV file with lead data (maximum 50 rows)
                  <br />
                  Supported format: .csv files up to 10MB
                </Typography>
              </Box>
            </label>

            <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Required columns:</strong> customerName, customerPhone,
                address, state, pinCode
                <br />
                <strong>Optional columns:</strong> customerEmail, services,
                requirements, assignedTo, source, followUpDate, remarks
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Preview Step */}
        {currentStep === ImportStep.PREVIEW && validationResult && (
          <Box>
            {/* Validation Summary */}
            <Box sx={{ mb: 3 }}>
              <Alert
                severity={validationResult.isValid ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  {validationResult.isValid
                    ? `✅ All ${parsedData.length} rows are valid and ready to import`
                    : `❌ Found ${validationResult.errors.length} validation errors in your CSV`}
                </Typography>
              </Alert>

              {/* Validation Errors */}
              {!validationResult.isValid && (
                <TableContainer
                  component={Paper}
                  sx={{ maxHeight: 200, mb: 2 }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Field</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResult.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>
                            <Chip
                              label={error.field}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{error.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* Data Preview */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Data Preview ({parsedData.length} rows)
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>PIN</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedData.slice(0, 10).map((row, index) => {
                    const rowErrors = validationResult.errors.filter(
                      e => e.row === index + 1
                    );
                    const hasErrors = rowErrors.length > 0;

                    return (
                      <TableRow
                        key={index}
                        sx={{
                          backgroundColor: hasErrors
                            ? 'error.light'
                            : 'inherit',
                        }}
                      >
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{row.customerPhone}</TableCell>
                        <TableCell>{row.customerEmail || '-'}</TableCell>
                        <TableCell>{row.state}</TableCell>
                        <TableCell>{row.pinCode}</TableCell>
                        <TableCell>
                          {hasErrors ? (
                            <Chip
                              icon={<ErrorIcon />}
                              label="Invalid"
                              size="small"
                              color="error"
                            />
                          ) : (
                            <Chip
                              icon={<SuccessIcon />}
                              label="Valid"
                              size="small"
                              color="success"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {parsedData.length > 10 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
              >
                Showing first 10 rows. {parsedData.length - 10} more rows will
                be imported.
              </Typography>
            )}
          </Box>
        )}

        {/* Importing Step */}
        {currentStep === ImportStep.IMPORTING && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={64} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Importing Leads...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we process your {parsedData.length} leads.
            </Typography>
          </Box>
        )}

        {/* Results Step */}
        {currentStep === ImportStep.RESULTS && importResults && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ mb: 3 }}>
              {importResults.data.errors.length === 0 ? (
                <SuccessIcon
                  sx={{ fontSize: 64, color: 'success.main', mb: 2 }}
                />
              ) : (
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              )}
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>
              Import{' '}
              {importResults.data.errors.length === 0
                ? 'Successful'
                : 'Completed with Errors'}
            </Typography>

            <Box
              sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}
            >
              <Chip
                icon={<SuccessIcon />}
                label={`${importResults.data.imported} Imported`}
                color="success"
                variant="outlined"
              />
              {importResults.data.errors.length > 0 && (
                <Chip
                  icon={<ErrorIcon />}
                  label={`${importResults.data.errors.length} Errors`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>

            {importResults.data.errors &&
              importResults.data.errors.length > 0 && (
                <Alert severity="error" sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Import Errors:</strong>
                  </Typography>
                  {importResults.data.errors
                    .slice(0, 5)
                    .map((error: any, index: number) => (
                      <Typography key={index} variant="body2">
                        Row {error.row}: {error.field} - {error.message}
                      </Typography>
                    ))}
                  {importResults.data.errors.length > 5 && (
                    <Typography variant="body2">
                      ... and {importResults.data.errors.length - 5} more errors
                    </Typography>
                  )}
                </Alert>
              )}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 1 }}>
        {currentStep === ImportStep.FILE_SELECT && (
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
        )}

        {currentStep === ImportStep.PREVIEW && (
          <>
            <Button onClick={handleBack} variant="outlined">
              Back
            </Button>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              variant="contained"
              disabled={!validationResult?.isValid}
              startIcon={<UploadIcon />}
            >
              Import {parsedData.length} Leads
            </Button>
          </>
        )}

        {currentStep === ImportStep.RESULTS && (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CSVImportDialog;
