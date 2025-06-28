/**
 * Leads Page - Main lead management interface
 * Combines lead grid, filters, and timeline drawer for comprehensive lead management
 */

import React, { useState, useCallback } from 'react';
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
} from '@mui/material';
import {
  Assignment as LeadIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  GetApp as ExportIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useLeadsTable } from '../../hooks/useLeadsTable';
import { useLeadAccess } from '../../hooks/useLeadAccess';
import { LeadFilters } from '../../components/lead/LeadFilters';
import { LeadGrid } from '../../components/lead/LeadGrid';
import { LeadTimelineDrawer } from '../../components/lead/LeadTimelineDrawer';
import { SkeletonLoader } from '../../components/loading';
import { ROUTES } from '../../routes/routes';

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

  // Lead capabilities
  const {
    canViewLeads,
    canCreateLeads,
    canManageAllLeads,
    hasTerritoryRestrictions,
    role,
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
    selectedLeads,
    setFilters,
    setSorting,
    setPage,
    setPageSize,
    selectLead,
    selectAll,
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
  const handleExportLeads = useCallback(() => {
    console.log('Export leads with current filters:', filters);
    // TODO: Implement CSV export functionality
  }, [filters]);

  /**
   * Handle bulk actions
   */
  const handleBulkStatusUpdate = useCallback(() => {
    console.log('Bulk update selected leads:', selectedLeads);
    // TODO: Implement bulk status update
  }, [selectedLeads]);

  const handleBulkReassign = useCallback(() => {
    console.log('Bulk reassign selected leads:', selectedLeads);
    // TODO: Implement bulk reassignment
  }, [selectedLeads]);

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
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    refresh();
    selectAll(false);
  }, [refresh, selectAll]);

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
                  disabled={isLoading}
                  size="small"
                  sx={{
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <ExportIcon />
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
      </Box>

      {/* Bulk Actions Toolbar */}
      {selectedLeads.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {selectedLeads.length} lead
                {selectedLeads.length === 1 ? '' : 's'} selected
              </Typography>
              {selectedLeads.length >= 50 && (
                <Chip
                  label="Max 50"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleBulkStatusUpdate}
                sx={{ color: 'inherit', borderColor: 'currentColor' }}
              >
                Update Status
              </Button>

              {canManageAllLeads && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleBulkReassign}
                  sx={{ color: 'inherit', borderColor: 'currentColor' }}
                >
                  Reassign
                </Button>
              )}

              <Button
                variant="outlined"
                size="small"
                onClick={() => selectAll(false)}
                sx={{ color: 'inherit', borderColor: 'currentColor' }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </Paper>
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
            selectedLeads={selectedLeads}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onSortChange={setSorting}
            onLeadSelect={selectLead}
            onSelectAll={selectAll}
            onLeadView={lead => {
              // Navigate to lead details or open modal
              console.log('View lead:', lead);
            }}
            onLeadEdit={lead => {
              // Navigate to lead edit form or open modal
              console.log('Edit lead:', lead);
            }}
            onLeadTimeline={lead => {
              setSelectedLeadForTimeline(lead.leadId);
            }}
            onLeadReassign={lead => {
              // Open reassign dialog
              console.log('Reassign lead:', lead);
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
              <br />• Selected: {selectedLeads.length}/50
              <br />• Auto-refresh: {isFetching ? 'Active' : 'Idle'}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default LeadsPage;
