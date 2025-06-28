/**
 * Lead Grid Component
 * Advanced data grid with filtering, pagination, territory scoping, and accessibility
 * Uses Material-UI Table with react-window for virtualization when needed
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Alert,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Timeline as TimelineIcon,
  PersonAdd as AssignIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { FixedSizeList as VirtualList } from 'react-window';
import { useLeadAccess } from '../../hooks/useLeadAccess';
import { LoadingSpinner } from '../loading';
import type { Lead } from '../../types/lead.types';
import { LeadStatusCell } from './LeadStatusCell';
import { LeadTimelineDrawer } from './LeadTimelineDrawer';
import { BulkActionToolbar } from './BulkActionToolbar';

/**
 * Lead grid props interface
 */
export interface LeadGridProps {
  leads: Lead[];
  total: number;
  loading: boolean;
  error: any;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  selectedLeads: string[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onLeadSelect: (leadId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onLeadView?: (lead: Lead) => void;
  onLeadEdit?: (lead: Lead) => void;
  onLeadTimeline?: (lead: Lead) => void;
  onLeadReassign?: (lead: Lead) => void;
  onRefresh?: () => void;
  enableVirtualization?: boolean;
  height?: number;
  // New bulk action props
  onBulkUpdateStatus?: () => void;
  onBulkReassign?: () => void;
  onBulkExport?: () => void;
}

/**
 * Table column configuration
 */
interface Column {
  id: keyof Lead | 'select' | 'actions';
  label: string;
  minWidth?: number;
  align: 'left' | 'right' | 'center';
  sortable?: boolean;
  format?: (value: any, row: Lead) => React.ReactNode;
}

/**
 * Get status color based on lead status
 */
const getStatusColor = (
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
 * Format date for display
 */
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString();
};

/**
 * Lead Grid Component
 */
export const LeadGrid: React.FC<LeadGridProps> = ({
  leads,
  total,
  loading,
  error,
  page,
  pageSize,
  sortBy,
  sortOrder,
  selectedLeads,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onLeadSelect,
  onSelectAll,
  onLeadView,
  onLeadEdit,
  onLeadTimeline,
  onLeadReassign,
  onRefresh,
  enableVirtualization = false,
  height = 600,
  // New bulk action props
  onBulkUpdateStatus,
  onBulkReassign,
  onBulkExport,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canPerformAction } = useLeadAccess();

  // Timeline drawer state
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);
  const [selectedLeadForTimeline, setSelectedLeadForTimeline] =
    useState<Lead | null>(null);

  // Define table columns
  const columns: Column[] = useMemo(
    () => [
      {
        id: 'select',
        label: '',
        minWidth: 50,
        align: 'center' as const,
      },
      {
        id: 'leadId',
        label: 'Lead ID',
        minWidth: 120,
        align: 'left' as const,
        sortable: true,
        format: (value: string) => (
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontWeight: 600 }}
          >
            {value}
          </Typography>
        ),
      },
      {
        id: 'customerName',
        label: 'Customer Name',
        minWidth: 180,
        align: 'left' as const,
        sortable: true,
        format: (value: string) => (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {value}
          </Typography>
        ),
      },
      {
        id: 'customerPhone',
        label: 'Phone',
        minWidth: 140,
        align: 'left' as const,
        format: (value: string) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {value}
          </Typography>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 200, // Increased width for edit button
        align: 'left' as const,
        sortable: true,
        format: (value: string, row: Lead) => (
          <LeadStatusCell
            lead={row}
            onStatusUpdated={updatedLead => {
              // Optional: Handle status update callback
              console.log(
                'Lead status updated:',
                updatedLead.leadId,
                updatedLead.status
              );
            }}
          />
        ),
      },
      {
        id: 'territory',
        label: 'Territory',
        minWidth: 100,
        align: 'left' as const,
        format: (value?: string) => value || '-',
      },
      {
        id: 'assignedCpName',
        label: 'Assigned CP',
        minWidth: 140,
        align: 'left' as const,
        format: (value?: string) => value || 'Unassigned',
      },
      {
        id: 'followUpDate',
        label: 'Follow-up',
        minWidth: 120,
        align: 'left' as const,
        sortable: true,
        format: (value?: string) => (
          <Typography
            variant="body2"
            color={
              value && new Date(value) < new Date()
                ? 'error.main'
                : 'text.secondary'
            }
          >
            {formatDate(value)}
          </Typography>
        ),
      },
      {
        id: 'createdAt',
        label: 'Created',
        minWidth: 120,
        align: 'left' as const,
        sortable: true,
        format: (value: string) => formatDate(value),
      },
      {
        id: 'actions',
        label: 'Actions',
        minWidth: 200,
        align: 'center' as const,
      },
    ],
    []
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (columnId: string) => {
      const isCurrentSort = sortBy === columnId;
      const newOrder = isCurrentSort && sortOrder === 'desc' ? 'asc' : 'desc';
      onSortChange(columnId, newOrder);
    },
    [sortBy, sortOrder, onSortChange]
  );

  // Handle select all checkbox
  const handleSelectAll = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      onSelectAll(event.target.checked);
    },
    [onSelectAll]
  );

  // Handle individual row selection
  const handleRowSelect = useCallback(
    (leadId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      onLeadSelect(leadId, event.target.checked);
    },
    [onLeadSelect]
  );

  // Handle action clicks
  const handleActionClick = useCallback(
    (action: string, lead: Lead) => (event: React.MouseEvent) => {
      event.stopPropagation();

      switch (action) {
        case 'view':
          onLeadView?.(lead);
          break;
        case 'edit':
          onLeadEdit?.(lead);
          break;
        case 'timeline':
          setSelectedLeadForTimeline(lead);
          setTimelineDrawerOpen(true);
          onLeadTimeline?.(lead);
          break;
        case 'reassign':
          onLeadReassign?.(lead);
          break;
      }
    },
    [onLeadView, onLeadEdit, onLeadTimeline, onLeadReassign]
  );

  // Calculate select all state
  const isAllSelected =
    leads.length > 0 && selectedLeads.length === leads.length;
  const isIndeterminate =
    selectedLeads.length > 0 && selectedLeads.length < leads.length;

  // Loading state
  if (loading && leads.length === 0) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <LoadingSpinner />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading leads...
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 3 }}>
          <Alert
            severity="error"
            action={
              onRefresh && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={onRefresh}
                  startIcon={<RefreshIcon />}
                >
                  Retry
                </Button>
              )
            }
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Failed to load leads
            </Typography>
            <Typography variant="body2">
              {error?.data?.message ||
                error?.message ||
                'An unexpected error occurred.'}
            </Typography>
          </Alert>
        </Box>
      </Paper>
    );
  }

  // Empty state
  if (leads.length === 0) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            gap: 2,
            p: 4,
          }}
        >
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            No leads found
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', maxWidth: 400 }}
          >
            Try adjusting your filters or create a new lead to get started.
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Render virtualized table for large datasets
  const shouldVirtualize = enableVirtualization && leads.length > 100;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedLeadIds={selectedLeads}
        totalLeadsCount={total}
        currentFilters={{}}
        onUpdateStatus={() => onBulkUpdateStatus?.()}
        onReassign={() => onBulkReassign?.()}
        onClear={() => onSelectAll(false)}
        disabled={loading}
      />

      <TableContainer sx={{ maxHeight: shouldVirtualize ? height : 'none' }}>
        <Table
          stickyHeader
          aria-label="leads table"
          size={isMobile ? 'small' : 'medium'}
        >
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{
                    backgroundColor: 'background.paper',
                    fontWeight: 600,
                  }}
                >
                  {column.id === 'select' ? (
                    <Checkbox
                      indeterminate={isIndeterminate}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      inputProps={{
                        'aria-label': 'select all leads',
                      }}
                    />
                  ) : column.sortable ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortOrder : 'desc'}
                      onClick={() => handleSortChange(column.id as string)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {shouldVirtualize ? (
            <TableBody component="div">
              <VirtualList
                height={height - 120} // Account for header and pagination
                width="100%"
                itemCount={leads.length}
                itemSize={60}
                itemData={{
                  leads,
                  columns,
                  selectedLeads,
                  onRowSelect: handleRowSelect,
                  onActionClick: handleActionClick,
                  canPerformAction,
                }}
              >
                {({ index, style, data }) => {
                  const {
                    leads,
                    columns,
                    selectedLeads,
                    onRowSelect,
                    onActionClick,
                    canPerformAction,
                  } = data;
                  const lead = leads[index];
                  if (!lead) return null;
                  const isSelected = selectedLeads.includes(lead.id);

                  return (
                    <div style={style}>
                      <TableRow
                        hover
                        selected={isSelected}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        {columns.map((column: Column) => {
                          if (column.id === 'select') {
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <Checkbox
                                  checked={selectedLeads.includes(lead.id)}
                                  onChange={handleRowSelect(lead.id)}
                                  onClick={e => e.stopPropagation()}
                                  inputProps={{
                                    'aria-label': `select lead ${lead.leadId}`,
                                  }}
                                />
                              </TableCell>
                            );
                          }

                          if (column.id === 'actions') {
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: 0.5,
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={onActionClick('view', lead)}
                                      disabled={
                                        !canPerformAction('read', lead)
                                          .hasAccess
                                      }
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Edit Lead">
                                    <IconButton
                                      size="small"
                                      onClick={onActionClick('edit', lead)}
                                      disabled={
                                        !canPerformAction('write', lead)
                                          .hasAccess
                                      }
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="View Timeline">
                                    <IconButton
                                      size="small"
                                      onClick={onActionClick('timeline', lead)}
                                      disabled={
                                        !canPerformAction('read', lead)
                                          .hasAccess
                                      }
                                    >
                                      <TimelineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reassign Lead">
                                    <IconButton
                                      size="small"
                                      onClick={onActionClick('reassign', lead)}
                                      disabled={
                                        !canPerformAction('reassign', lead)
                                          .hasAccess
                                      }
                                    >
                                      <AssignIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            );
                          }

                          const value = lead[column.id as keyof Lead];
                          const formattedValue = column.format
                            ? column.format(value, lead)
                            : value;

                          return (
                            <TableCell key={column.id} align={column.align}>
                              {formattedValue}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </div>
                  );
                }}
              </VirtualList>
            </TableBody>
          ) : (
            <TableBody>
              {leads.map(lead => {
                const isSelected = selectedLeads.includes(lead.id);

                return (
                  <TableRow
                    hover
                    selected={isSelected}
                    key={lead.id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {columns.map(column => {
                      if (column.id === 'select') {
                        return (
                          <TableCell key={column.id} align={column.align}>
                            <Checkbox
                              checked={selectedLeads.includes(lead.id)}
                              onChange={handleRowSelect(lead.id)}
                              onClick={e => e.stopPropagation()}
                              inputProps={{
                                'aria-label': `select lead ${lead.leadId}`,
                              }}
                            />
                          </TableCell>
                        );
                      }

                      if (column.id === 'actions') {
                        return (
                          <TableCell key={column.id} align={column.align}>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 0.5,
                                justifyContent: 'center',
                              }}
                            >
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={handleActionClick('view', lead)}
                                  disabled={
                                    !canPerformAction('read', lead).hasAccess
                                  }
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Lead">
                                <IconButton
                                  size="small"
                                  onClick={handleActionClick('edit', lead)}
                                  disabled={
                                    !canPerformAction('write', lead).hasAccess
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View Timeline">
                                <IconButton
                                  size="small"
                                  onClick={handleActionClick('timeline', lead)}
                                  disabled={
                                    !canPerformAction('read', lead).hasAccess
                                  }
                                >
                                  <TimelineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reassign Lead">
                                <IconButton
                                  size="small"
                                  onClick={handleActionClick('reassign', lead)}
                                  disabled={
                                    !canPerformAction('reassign', lead)
                                      .hasAccess
                                  }
                                >
                                  <AssignIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        );
                      }

                      const value = lead[column.id as keyof Lead];
                      const formattedValue = column.format
                        ? column.format(value, lead)
                        : value;

                      return (
                        <TableCell key={column.id} align={column.align}>
                          {formattedValue}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          )}
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={total}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={(event, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={event =>
          onPageSizeChange(parseInt(event.target.value, 10))
        }
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
        }
        labelRowsPerPage="Leads per page:"
      />

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <LoadingSpinner />
        </Box>
      )}

      {/* Timeline Drawer */}
      <LeadTimelineDrawer
        open={timelineDrawerOpen}
        onClose={() => {
          setTimelineDrawerOpen(false);
          setSelectedLeadForTimeline(null);
        }}
        lead={selectedLeadForTimeline}
        initialLimit={25}
      />
    </Paper>
  );
};

export default LeadGrid;
