/**
 * Leads Page - Main lead management interface
 * Combines lead grid, filters, and timeline drawer for comprehensive lead management
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  Assignment as LeadIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  GetApp as ExportIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useLeadsTable } from '../../hooks/useLeadsTable';
import { useLeadAccess } from '../../hooks/useLeadAccess';
import { useToast } from '../../hooks/useToast';
import {
  LeadFilters,
  LeadGrid,
  LeadTimelineDrawer,
} from '../../components/lead';
import { BulkActionToolbar } from '../../components/lead/BulkActionToolbar';
import { BulkStatusDialog } from '../../components/lead/BulkStatusDialog';
import { BulkReassignDialog } from '../../components/lead/BulkReassignDialog';
import { CSVImportDialog } from '../../components/lead/CSVImportDialog';
import { SkeletonLoader } from '../../components/loading';
import { ROUTES } from '../../routes/routes';
import { LEAD_CONFIG } from '../../utils/constants';
import { useCSVExport } from '../../hooks/useCSVExport';

/**
 * Lead capabilities hook for access control
 */
const useLeadCapabilities = () => {
  const { canPerformAction, isAdmin, isKAM, userTerritories } = useLeadAccess();

  return {
    canViewLeads: canPerformAction('read').hasAccess,
    canCreateLeads: canPerformAction('write').hasAccess,
    canManageAllLeads: isAdmin,
    hasTerritoryRestrictions: !isAdmin && userTerritories.length > 0,
    role: isAdmin ? 'admin' : isKAM ? 'kam' : 'cp',
    canAccessLead: useLeadAccess().canAccessLead,
  };
};

/**
 * Lead Grid States Components
 */
const LeadGridStates = {
  Skeleton: ({ rows = 10 }: { rows?: number }) => (
    <Box sx={{ p: 3 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonLoader key={index} height={60} />
      ))}
    </Box>
  ),

  Error: ({
    error,
    onRetry,
    showDetails,
  }: {
    error: any;
    onRetry: () => void;
    showDetails?: boolean;
  }) => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" color="error" gutterBottom>
        Error Loading Leads
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {error?.data?.message || error?.message || 'Failed to load leads'}
      </Typography>
      {showDetails && error && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: 'monospace', mb: 2, display: 'block' }}
        >
          {JSON.stringify(error, null, 2)}
        </Typography>
      )}
      <Button variant="contained" onClick={onRetry} startIcon={<RefreshIcon />}>
        Retry
      </Button>
    </Box>
  ),

  Empty: ({
    hasFilters,
    onClearFilters,
    onCreateLead,
    canCreateLeads,
  }: {
    hasFilters: boolean;
    onClearFilters: () => void;
    onCreateLead?: () => void;
    canCreateLeads: boolean;
  }) => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <LeadIcon
        sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }}
      />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {hasFilters ? 'No leads match your filters' : 'No leads yet'}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
      >
        {hasFilters
          ? 'Try adjusting your search criteria or clearing filters to see more results.'
          : 'Start by creating your first lead or importing existing data.'}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {hasFilters && (
          <Button variant="outlined" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
        {canCreateLeads && onCreateLead && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateLead}
          >
            Create Lead
          </Button>
        )}
      </Box>
    </Box>
  ),
};

/**
 * Leads Page Component
 * Main interface for lead management with filtering, pagination, and actions
 */
const LeadsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // Lead capabilities and access control
  const {
    canViewLeads,
    canCreateLeads,
    canManageAllLeads,
    hasTerritoryRestrictions,
    role,
    canAccessLead,
  } = useLeadCapabilities();

  // Table state management
  const {
    leads,
    total,
    isLoading,
    isError,
    isFetching,
    error,
    filters,
    sortBy,
    sortOrder,
    page,
    pageSize,
    totalPages,
    setFilters,
    setSorting,
    setPage,
    setPageSize,
    clearFilters,
    refresh,
    isEmpty,
    hasFilters,
  } = useLeadsTable({
    initialPageSize: 25,
  });

  // Local state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedLeadForTimeline, setSelectedLeadForTimeline] = useState<
    string | null
  >(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkReassignDialogOpen, setBulkReassignDialogOpen] = useState(false);
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);

  // Effect to clear selection when page changes
  useEffect(() => {
    setSelectedLeadIds([]);
  }, [page, pageSize, sortBy, sortOrder, filters]);

  // Toast notifications
  const { showError, showSuccess, showWarning } = useToast();

  // CSV Export
  const { exportLeads, isExporting } = useCSVExport();

  // Memoize current filters for export
  const currentFiltersForExport = useMemo(() => {
    const { offset, limit, ...exportFilters } = filters;
    return exportFilters;
  }, [filters]);

  // Access control check
  if (!user || !canViewLeads) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LeadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You do not have permission to view leads.
          </Typography>
        </Paper>
      </Box>
    );
  }

  /**
   * Handle lead creation
   */
  const handleCreateLead = useCallback(() => {
    console.log('Navigate to create lead form');
    // TODO: Navigate to lead creation form or open modal
  }, []);

  /**
   * Handle lead export
   */
  const handleExportLeads = useCallback(async () => {
    try {
      await exportLeads(filters, {
        format: 'csv',
        filename: `${LEAD_CONFIG.EXPORT_FILENAME_PREFIX}-${new Date().toISOString().slice(0, 10)}.csv`,
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      showError(error.message || 'Failed to export leads', 'Export Failed');
    }
  }, [filters, exportLeads, showError]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  /**
   * Handle lead selection
   */
  const handleLeadSelect = useCallback(
    (leadId: string, selected: boolean) => {
      // Get the lead object
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      // Check territory access
      const accessResult = canAccessLead(lead);

      if (!accessResult.hasAccess) {
        showError(
          `Cannot select lead: ${accessResult.message}`,
          'Territory Access Denied'
        );
        return;
      }

      if (selected && selectedLeadIds.length >= 50) {
        showError(
          'Maximum 50 leads can be selected at once',
          'Selection Limit'
        );
        return;
      }
      setSelectedLeadIds(prev => {
        if (selected) {
          return [...prev, leadId];
        } else {
          return prev.filter(id => id !== leadId);
        }
      });
    },
    [selectedLeadIds.length, showError, leads, canAccessLead]
  );

  /**
   * Handle select all leads
   */
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        // Filter leads by territory access and limit to 50
        const accessibleLeads = leads
          .filter(lead => canAccessLead(lead).hasAccess)
          .slice(0, 50);

        if (accessibleLeads.length < leads.length) {
          showWarning(
            'Some leads were not selected due to territory restrictions',
            'Limited Selection'
          );
        }

        setSelectedLeadIds(accessibleLeads.map(lead => lead.id));
      } else {
        setSelectedLeadIds([]);
      }
    },
    [leads, canAccessLead, showWarning]
  );

  /**
   * Handle clear selection
   */
  const handleClearSelection = useCallback(() => {
    setSelectedLeadIds([]);
  }, []);

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc') => {
      setSorting(
        sortBy as
          | 'createdAt'
          | 'updatedAt'
          | 'followUpDate'
          | 'customerName'
          | 'status',
        sortOrder
      );
    },
    [setSorting]
  );

  /**
   * Handle bulk status update
   */
  const handleBulkStatusUpdate = useCallback(() => {
    if (selectedLeadIds.length === 0) {
      showError('Please select leads to update', 'No Selection');
      return;
    }
    setBulkStatusDialogOpen(true);
  }, [selectedLeadIds.length, showError]);

  /**
   * Handle bulk reassignment
   */
  const handleBulkReassign = useCallback(() => {
    if (selectedLeadIds.length === 0) {
      showError('Please select leads to reassign', 'No Selection');
      return;
    }
    setBulkReassignDialogOpen(true);
  }, [selectedLeadIds.length, showError]);

  /**
   * Handle CSV import
   */
  const handleCSVImport = useCallback(() => {
    setCsvImportDialogOpen(true);
  }, []);

  /**
   * Handle successful bulk operation
   */
  const handleBulkOperationSuccess = useCallback(
    (successCount: number) => {
      // Clear selection
      handleClearSelection();

      // Refresh the list
      handleRefresh();

      // Show success message
      showSuccess(
        `Successfully processed ${successCount} lead${successCount !== 1 ? 's' : ''}`,
        'Operation Complete'
      );
    },
    [handleClearSelection, handleRefresh, showSuccess]
  );

  /**
   * Handle timeline view
   */
  const handleViewTimeline = useCallback((leadId: string) => {
    setSelectedLeadForTimeline(leadId);
  }, []);

  const handleCloseTimeline = useCallback(() => {
    setSelectedLeadForTimeline(null);
  }, []);

  /**
   * Get selected lead objects from their IDs
   */
  const getSelectedLeadObjects = useCallback(() => {
    return leads?.filter(lead => selectedLeadIds.includes(lead.id)) || [];
  }, [leads, selectedLeadIds]);

  return (
    <Box className="leads-page" component="main">
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LeadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 0.5,
                }}
              >
                Leads Management
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Manage and track lead progress through the sales pipeline
                </Typography>

                {hasTerritoryRestrictions && (
                  <Chip
                    label={`Territory Limited (${role?.toUpperCase()})`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}

                {total > 0 && (
                  <Chip
                    label={`${total} leads`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Header Actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {/* Export */}
            {canManageAllLeads && (
              <Tooltip title="Export leads">
                <IconButton
                  onClick={handleExportLeads}
                  disabled={isLoading || isExporting}
                  size="small"
                  sx={{
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  {isExporting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <ExportIcon />
                  )}
                </IconButton>
              </Tooltip>
            )}

            {/* View Mode Toggle */}
            <Box
              sx={{
                display: 'flex',
                bgcolor: 'background.paper',
                borderRadius: 1,
                p: 0.5,
              }}
            >
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
              >
                <ListIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
              >
                <GridIcon />
              </IconButton>
            </Box>

            {/* Refresh */}
            <Tooltip title="Refresh leads">
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            {/* Create Lead */}
            {canCreateLeads && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateLead}
                disabled={isLoading}
                sx={{ minWidth: isMobile ? 'auto' : 140 }}
              >
                {isMobile ? '' : 'New Lead'}
              </Button>
            )}

            {/* Development indicator */}
            {process.env.NODE_ENV === 'development' && (
              <Tooltip title="Development mode active">
                <Chip
                  icon={<InfoIcon />}
                  label="DEV"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Filters Section */}
      <Box sx={{ mb: 3 }}>
        <LeadFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          totalCount={total}
          filteredCount={leads.length}
        />

        {/* Bulk Action Toolbar */}
        <BulkActionToolbar
          selectedLeadIds={selectedLeadIds}
          totalLeadsCount={total}
          currentFilters={currentFiltersForExport}
          onUpdateStatus={handleBulkStatusUpdate}
          onReassign={handleBulkReassign}
          onClear={handleClearSelection}
          disabled={isLoading}
        />
      </Box>

      {/* Import/Export Actions - Admin Only */}
      {canManageAllLeads && (
        <Box
          sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}
        >
          <Button
            variant="outlined"
            onClick={handleCSVImport}
            startIcon={<UploadIcon />}
            sx={{ textTransform: 'none' }}
          >
            Import CSV
          </Button>
        </Box>
      )}

      {/* Main Content */}
      <Paper
        elevation={1}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          minHeight: 400,
        }}
      >
        {/* Loading State */}
        {isLoading && !isFetching && <LeadGridStates.Skeleton rows={10} />}

        {/* Error State */}
        {isError && (
          <LeadGridStates.Error
            error={error}
            onRetry={handleRefresh}
            showDetails={process.env.NODE_ENV === 'development'}
          />
        )}

        {/* Empty State */}
        {isEmpty && !isLoading && (
          <LeadGridStates.Empty
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            {...(canCreateLeads && { onCreateLead: handleCreateLead })}
            canCreateLeads={canCreateLeads}
          />
        )}

        {/* Success State - Lead Grid */}
        {!isLoading && !isError && !isEmpty && (
          <LeadGrid
            leads={leads}
            total={total}
            loading={isFetching}
            error={null}
            page={page}
            pageSize={pageSize}
            sortBy={sortBy}
            sortOrder={sortOrder}
            selectedLeads={selectedLeadIds}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onSortChange={handleSortChange}
            onLeadSelect={handleLeadSelect}
            onSelectAll={handleSelectAll}
            onLeadView={lead => {
              // Navigate to lead details or open modal
              console.log('View lead:', lead);
            }}
            onLeadEdit={lead => {
              // For individual edit, we can reuse the bulk status dialog with single lead
              handleSelectAll(false);
              handleLeadSelect(lead.id, true);
              setBulkStatusDialogOpen(true);
            }}
            onLeadTimeline={lead => {
              setSelectedLeadForTimeline(lead.leadId);
            }}
            onLeadReassign={lead => {
              // For individual reassign, we can reuse the bulk dialog with single lead
              handleSelectAll(false);
              handleLeadSelect(lead.id, true);
              setBulkReassignDialogOpen(true);
            }}
            onRefresh={refresh}
            enableVirtualization={leads.length > 100}
          />
        )}
      </Paper>

      {/* Timeline Drawer */}
      {selectedLeadForTimeline && (
        <LeadTimelineDrawer
          lead={
            leads.find(lead => lead.leadId === selectedLeadForTimeline) || null
          }
          open={!!selectedLeadForTimeline}
          onClose={handleCloseTimeline}
        />
      )}

      {/* Bulk Status Dialog */}
      <BulkStatusDialog
        open={bulkStatusDialogOpen}
        onClose={() => setBulkStatusDialogOpen(false)}
        selectedLeadIds={selectedLeadIds}
        onSuccess={handleBulkOperationSuccess}
      />

      <BulkReassignDialog
        open={bulkReassignDialogOpen}
        onClose={() => setBulkReassignDialogOpen(false)}
        selectedLeadIds={selectedLeadIds}
        onSuccess={handleBulkOperationSuccess}
      />

      <CSVImportDialog
        open={csvImportDialogOpen}
        onClose={() => setCsvImportDialogOpen(false)}
        onSuccess={handleBulkOperationSuccess}
      />

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'grey.200',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Development Info:
            </Typography>
            <Typography
              variant="body2"
              component="div"
              sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            >
              • Route: {ROUTES.LEADS}
              <br />• Access: {role} ({canViewLeads ? 'Can View' : 'No Access'})
              <br />• User: {user?.name} ({user?.role})
              <br />• Territory Restrictions:{' '}
              {hasTerritoryRestrictions ? 'Yes' : 'No'}
              <br />• Leads: {leads.length} total, {leads.length} filtered
              <br />• Selected: {selectedLeadIds.length}/50
              <br />• Auto-refresh: {isFetching ? 'Active' : 'Idle'}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default LeadsPage;
