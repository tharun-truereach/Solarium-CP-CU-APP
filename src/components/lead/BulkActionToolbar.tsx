/**
 * Bulk Action Toolbar Component
 *
 * Provides a sticky toolbar for bulk operations on selected leads including:
 * - Bulk status updates (max 50 leads)
 * - Bulk reassignment to Channel Partners
 * - CSV export with current filters
 * - Selection management and limits
 *
 * Features:
 * - Responsive design (desktop buttons, mobile icons)
 * - Real-time selection validation
 * - Role-based access control
 * - Territory filtering support
 *
 * @param props - Component props
 * @param props.selectedLeadIds - Array of selected lead IDs
 * @param props.totalLeadsCount - Total leads matching current filters
 * @param props.currentFilters - Active filters for export context
 * @param props.onUpdateStatus - Callback for bulk status update
 * @param props.onReassign - Callback for bulk reassignment
 * @param props.onClear - Callback to clear selection
 * @param props.disabled - Disable all actions
 *
 * @example
 * ```tsx
 * <BulkActionToolbar
 *   selectedLeadIds={['LEAD-001', 'LEAD-002']}
 *   totalLeadsCount={150}
 *   currentFilters={{ status: 'New Lead' }}
 *   onUpdateStatus={() => setBulkStatusDialog(true)}
 *   onReassign={() => setBulkReassignDialog(true)}
 *   onClear={() => setSelectedIds([])}
 * />
 * ```
 */

import React, { useEffect } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PlaylistAddCheck as BulkStatusIcon,
  PersonAdd as ReassignIcon,
  FileDownload as ExportIcon,
  Clear as ClearIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useLeadAccess } from '../../hooks/useLeadAccess';
import { useToast } from '../../hooks/useToast';
import { useCSVExport } from '../../hooks/useCSVExport';
import type { LeadQuery } from '../../types/lead.types';

/**
 * Bulk action toolbar props
 */
export interface BulkActionToolbarProps {
  selectedLeadIds: string[];
  totalLeadsCount: number;
  currentFilters?: LeadQuery;
  onUpdateStatus: () => void;
  onReassign: () => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Maximum leads that can be selected for bulk operations
 */
const MAX_BULK_SELECTION = 50;

/**
 * Bulk Action Toolbar Component
 */
export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedLeadIds,
  totalLeadsCount,
  currentFilters,
  onUpdateStatus,
  onReassign,
  onClear,
  disabled = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin, isKAM } = useLeadAccess();
  const { showError, showWarning } = useToast();
  const { exportLeads, isExporting } = useCSVExport();

  const selectedCount = selectedLeadIds?.length || 0;
  const isOverLimit = selectedCount > MAX_BULK_SELECTION;
  const canPerformBulkActions = (isAdmin || isKAM) && !disabled;

  // Show warning if over limit
  useEffect(() => {
    if (isOverLimit) {
      showError(
        `Maximum ${MAX_BULK_SELECTION} leads can be selected at once. Please clear selection and try again.`,
        'Selection Limit Exceeded'
      );
    }
  }, [isOverLimit, showError]);

  /**
   * Handle bulk status update
   */
  const handleBulkStatus = () => {
    if (isOverLimit) {
      showError(
        `Cannot update more than ${MAX_BULK_SELECTION} leads at once. You have selected ${selectedCount} leads.`,
        'Selection Limit Exceeded'
      );
      return;
    }

    if (!canPerformBulkActions) {
      showError(
        'You do not have permission to perform bulk operations.',
        'Access Denied'
      );
      return;
    }

    onUpdateStatus();
  };

  /**
   * Handle bulk reassignment
   */
  const handleBulkReassign = () => {
    if (isOverLimit) {
      showError(
        `Cannot reassign more than ${MAX_BULK_SELECTION} leads at once. You have selected ${selectedCount} leads.`,
        'Selection Limit Exceeded'
      );
      return;
    }

    if (!canPerformBulkActions) {
      showError(
        'You do not have permission to perform bulk operations.',
        'Access Denied'
      );
      return;
    }

    onReassign();
  };

  /**
   * Handle CSV export
   */
  const handleExport = async () => {
    try {
      await exportLeads(currentFilters, {
        format: 'csv',
        filename: `leads-export-${new Date().toISOString().slice(0, 10)}.csv`,
      });
    } catch (error: any) {
      console.error('Export failed:', error);
    }
  };

  /**
   * Handle clear selection
   */
  const handleClear = () => {
    onClear();
  };

  if (!selectedCount) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 1,
      }}
    >
      {/* Warning for over-limit selection */}
      {isOverLimit && (
        <Alert
          severity="warning"
          sx={{ borderRadius: 0 }}
          icon={<WarningIcon />}
        >
          <Typography variant="body2">
            <strong>Selection limit exceeded:</strong> You have selected{' '}
            <strong>{selectedCount}</strong> leads, but bulk operations are
            limited to <strong>{MAX_BULK_SELECTION}</strong> leads at a time.
          </Typography>
        </Alert>
      )}

      <Toolbar
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1,
          minHeight: { xs: 56, sm: 64 },
          backgroundColor:
            selectedCount > 0 ? 'primary.light' : 'background.paper',
          color: selectedCount > 0 ? 'primary.contrastText' : 'text.primary',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {/* Selection Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {selectedCount > 0 ? (
            <>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedCount} Lead{selectedCount !== 1 ? 's' : ''} Selected
              </Typography>

              {isOverLimit && (
                <Chip
                  label={`Limit: ${MAX_BULK_SELECTION}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{
                    backgroundColor: 'warning.light',
                    color: 'warning.dark',
                    fontWeight: 600,
                  }}
                />
              )}
            </>
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bulk Actions
            </Typography>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Bulk Actions (only show if leads are selected) */}
          {selectedCount > 0 && (
            <>
              {!isMobile && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<BulkStatusIcon />}
                    onClick={handleBulkStatus}
                    disabled={isOverLimit || !canPerformBulkActions}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    Update Status
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<ReassignIcon />}
                    onClick={handleBulkReassign}
                    disabled={isOverLimit || !canPerformBulkActions}
                    sx={{
                      borderColor: 'primary.contrastText',
                      color: 'primary.contrastText',
                      '&:hover': {
                        borderColor: 'primary.contrastText',
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    Reassign
                  </Button>
                </>
              )}

              {/* Mobile: Icon buttons */}
              {isMobile && (
                <>
                  <Tooltip title="Update Status">
                    <IconButton
                      onClick={handleBulkStatus}
                      disabled={isOverLimit || !canPerformBulkActions}
                      sx={{ color: 'primary.contrastText' }}
                    >
                      <BulkStatusIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Reassign">
                    <IconButton
                      onClick={handleBulkReassign}
                      disabled={isOverLimit || !canPerformBulkActions}
                      sx={{ color: 'primary.contrastText' }}
                    >
                      <ReassignIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            </>
          )}

          {/* Export Button - Always visible */}
          {!isMobile ? (
            <Button
              variant={selectedCount > 0 ? 'outlined' : 'contained'}
              startIcon={<ExportIcon />}
              onClick={handleExport}
              disabled={isExporting}
              sx={
                selectedCount > 0
                  ? {
                      borderColor: 'primary.contrastText',
                      color: 'primary.contrastText',
                      '&:hover': {
                        borderColor: 'primary.contrastText',
                        backgroundColor: 'primary.dark',
                      },
                    }
                  : {}
              }
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          ) : (
            <Tooltip title="Export CSV">
              <IconButton
                onClick={handleExport}
                disabled={isExporting}
                sx={{
                  color:
                    selectedCount > 0 ? 'primary.contrastText' : 'primary.main',
                }}
              >
                <ExportIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Clear Selection - Only show if leads are selected */}
          {selectedCount > 0 && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <Tooltip title="Clear Selection">
                <IconButton
                  onClick={handleClear}
                  sx={{ color: 'primary.contrastText' }}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Toolbar>

      {/* Export Info - Show current filter context */}
      {Object.keys(currentFilters || {})?.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 1,
            backgroundColor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Export will include {totalLeadsCount} leads matching current filters
            {selectedCount > 0 && ` (${selectedCount} selected)`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BulkActionToolbar;
