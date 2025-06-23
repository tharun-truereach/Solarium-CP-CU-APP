/**
 * Audit Log Table component with virtualization and accessibility
 * Displays settings change history with pagination and sorting
 */

import React, { useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { FixedSizeList as List } from 'react-window';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import type { SettingsAuditLog } from '../../types/settings.types';

/**
 * Table column configuration
 */
interface Column {
  id: keyof SettingsAuditLog | 'actions';
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  format?: (value: any, row: SettingsAuditLog) => React.ReactNode;
}

/**
 * Audit log table props
 */
interface AuditLogTableProps {
  height?: number;
  enableVirtualization?: boolean;
  onViewDetails?: (log: SettingsAuditLog) => void;
}

/**
 * Format old/new values for display
 */
const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

/**
 * Get severity color for changes
 */
const getChangeSeverity = (
  field: string
): 'default' | 'warning' | 'error' | 'info' => {
  if (
    field.includes('security') ||
    field.includes('token') ||
    field.includes('password')
  ) {
    return 'error';
  }
  if (field.includes('featureFlags')) {
    return 'info';
  }
  if (field.includes('threshold') || field.includes('timeout')) {
    return 'warning';
  }
  return 'default';
};

/**
 * Virtual row component for large datasets
 */
interface VirtualRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    logs: SettingsAuditLog[];
    columns: Column[];
    onViewDetails?: (log: SettingsAuditLog) => void;
  };
}

const VirtualRow: React.FC<VirtualRowProps> = ({ index, style, data }) => {
  const { logs, columns, onViewDetails } = data;
  const log = logs[index];

  if (!log) return null;

  return (
    <div style={style}>
      <TableRow
        hover
        tabIndex={-1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => onViewDetails?.(log)}
      >
        {columns.map(column => {
          if (column.id === 'actions') {
            return (
              <TableCell
                key={column.id}
                {...(column.align && { align: column.align })}
              >
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => onViewDetails?.(log)}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            );
          }

          const value = log[column.id as keyof SettingsAuditLog];
          const formattedValue = column.format
            ? column.format(value, log)
            : value;

          return (
            <TableCell
              key={column.id}
              {...(column.align && { align: column.align })}
            >
              {formattedValue}
            </TableCell>
          );
        })}
      </TableRow>
    </div>
  );
};

/**
 * Main Audit Log Table component
 */
const AuditLogTable: React.FC<AuditLogTableProps> = ({
  height = 600,
  enableVirtualization = true,
  onViewDetails,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Use audit logs hook
  const {
    logs,
    total,
    totalPages,
    page,
    pageSize,
    sortBy,
    sortOrder,
    isLoading,
    isFetching,
    isError,
    error,
    isEmpty,
    setPage,
    setPageSize,
    setSorting,
    refresh,
  } = useAuditLogs({
    initialPageSize: 10,
    pollingInterval: 30000, // Refresh every 30 seconds
  });

  // Define table columns
  const columns: Column[] = useMemo(
    () => [
      {
        id: 'timestamp',
        label: 'Time',
        minWidth: 160,
        sortable: true,
        format: (value: string) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {new Date(value).toLocaleString()}
          </Typography>
        ),
      },
      {
        id: 'userName',
        label: 'User',
        minWidth: 140,
        sortable: true,
        format: (value: string) => (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {value}
          </Typography>
        ),
      },
      {
        id: 'field',
        label: 'Field',
        minWidth: 180,
        sortable: true,
        format: (value: string) => (
          <Chip
            label={value}
            size="small"
            color={getChangeSeverity(value)}
            variant="outlined"
          />
        ),
      },
      {
        id: 'oldValue',
        label: 'Old Value',
        minWidth: 120,
        format: (value: any) => (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              color: 'error.main',
              backgroundColor: 'error.light',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              maxWidth: 100,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={formatValue(value)}
          >
            {formatValue(value)}
          </Typography>
        ),
      },
      {
        id: 'newValue',
        label: 'New Value',
        minWidth: 120,
        format: (value: any) => (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              color: 'success.main',
              backgroundColor: 'success.light',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              maxWidth: 100,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={formatValue(value)}
          >
            {formatValue(value)}
          </Typography>
        ),
      },
      ...(onViewDetails
        ? [
            {
              id: 'actions' as const,
              label: 'Actions',
              minWidth: 80,
              align: 'center' as const,
            },
          ]
        : []),
    ],
    [onViewDetails]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (field: string) => {
      const isCurrentField = sortBy === field;
      const newOrder = isCurrentField && sortOrder === 'desc' ? 'asc' : 'desc';
      setSorting(field, newOrder);
    },
    [sortBy, sortOrder, setSorting]
  );

  // Handle pagination change
  const handlePageChange = useCallback(
    (event: unknown, newPage: number) => {
      setPage(newPage + 1); // MUI uses 0-based, our hook uses 1-based
    },
    [setPage]
  );

  const handlePageSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPageSize(parseInt(event.target.value, 10));
    },
    [setPageSize]
  );

  // Determine if virtualization should be used
  const shouldVirtualize = enableVirtualization && logs.length > 1000;

  // Loading state
  if (isLoading && !logs.length) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading audit logs...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <IconButton color="inherit" size="small" onClick={refresh}>
            <RefreshIcon />
          </IconButton>
        }
      >
        Failed to load audit logs: {error?.message || 'Unknown error'}
      </Alert>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No audit logs found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Settings changes will appear here once they occur.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header with actions */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" component="h3">
          Settings Audit Log
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={refresh} disabled={isFetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: shouldVirtualize ? height : 'none' }}>
        <Table stickyHeader aria-label="audit log table">
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell
                  key={column.id}
                  {...(column.align && { align: column.align })}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable ? (
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
              <List
                height={height - 120} // Account for header and pagination
                width="100%"
                itemCount={logs.length}
                itemSize={60}
                itemData={{
                  logs,
                  columns,
                  ...(onViewDetails && { onViewDetails }),
                }}
              >
                {VirtualRow}
              </List>
            </TableBody>
          ) : (
            <TableBody>
              {logs.map(log => (
                <TableRow
                  hover
                  tabIndex={-1}
                  key={log.id}
                  sx={{
                    cursor: onViewDetails ? 'pointer' : 'default',
                    '&:hover': onViewDetails
                      ? {
                          backgroundColor: 'action.hover',
                        }
                      : {},
                  }}
                  onClick={() => onViewDetails?.(log)}
                >
                  {columns.map(column => {
                    if (column.id === 'actions') {
                      return (
                        <TableCell
                          key={column.id}
                          {...(column.align && { align: column.align })}
                        >
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                onViewDetails?.(log);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      );
                    }

                    const value = log[column.id as keyof SettingsAuditLog];
                    const formattedValue = column.format
                      ? column.format(value, log)
                      : value;

                    return (
                      <TableCell
                        key={column.id}
                        {...(column.align && { align: column.align })}
                      >
                        {formattedValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={total}
        rowsPerPage={pageSize}
        page={page - 1} // Convert from 1-based to 0-based for MUI
        onPageChange={handlePageChange}
        onRowsPerPageChange={handlePageSizeChange}
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
        }
        labelRowsPerPage="Logs per page:"
      />

      {/* Loading overlay */}
      {isFetching && (
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
          <CircularProgress size={24} />
        </Box>
      )}
    </Paper>
  );
};

export default AuditLogTable;
