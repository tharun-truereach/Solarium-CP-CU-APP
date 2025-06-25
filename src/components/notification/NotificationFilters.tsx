/**
 * Notification Filters Component
 * Provides filtering interface for notifications by status, type, and search
 */

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Typography,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import type {
  NotificationFilter,
  NotificationType,
  NotificationStatus,
} from '../../types';

/**
 * Filter component props interface
 */
export interface NotificationFiltersProps {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  onClearFilter: () => void;
  totalCount: number;
  unreadCount: number;
  isMobile?: boolean;
}

/**
 * Notification type options
 */
const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'security', label: 'Security' },
  { value: 'lead', label: 'Lead' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'commission', label: 'Commission' },
  { value: 'user', label: 'User' },
  { value: 'announcement', label: 'Announcement' },
];

/**
 * Priority options
 */
const PRIORITY_OPTIONS: { value: 'low' | 'medium' | 'high'; label: string }[] =
  [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

/**
 * Filter notifications client-side
 */
export const filterNotifications = (
  notifications: any[],
  filter: NotificationFilter
) => {
  return notifications.filter(notification => {
    // Status filter (handled server-side mostly, but can be client-side too)
    if (filter.status && notification.status !== filter.status) {
      return false;
    }

    // Type filter (handled server-side mostly, but can be client-side too)
    if (filter.type && notification.type !== filter.type) {
      return false;
    }

    // Priority filter (client-side)
    if (filter.priority && notification.priority !== filter.priority) {
      return false;
    }

    // Search term filter (client-side)
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      const matchesTitle = notification.title
        .toLowerCase()
        .includes(searchLower);
      const matchesMessage = notification.message
        .toLowerCase()
        .includes(searchLower);
      if (!matchesTitle && !matchesMessage) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Notification Filters Component
 */
export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  filter,
  onFilterChange,
  onClearFilter,
  totalCount,
  unreadCount,
  isMobile = false,
}) => {
  /**
   * Handle filter field changes
   */
  const handleFilterChange = (field: keyof NotificationFilter, value: any) => {
    onFilterChange({
      ...filter,
      [field]: value || undefined, // Convert empty strings to undefined
    });
  };

  /**
   * Handle status filter change
   */
  const handleStatusChange = (status: NotificationStatus | '') => {
    handleFilterChange('status', status);
  };

  /**
   * Handle type filter change
   */
  const handleTypeChange = (type: NotificationType | '') => {
    handleFilterChange('type', type);
  };

  /**
   * Handle priority filter change
   */
  const handlePriorityChange = (priority: 'low' | 'medium' | 'high' | '') => {
    handleFilterChange('priority', priority);
  };

  /**
   * Handle search term change
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('searchTerm', event.target.value);
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = Boolean(
    filter.status || filter.type || filter.priority || filter.searchTerm
  );

  /**
   * Get active filter count
   */
  const activeFilterCount = [
    filter.status,
    filter.type,
    filter.priority,
    filter.searchTerm,
  ].filter(Boolean).length;

  return (
    <Box>
      {/* Filter Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FilterIcon color="primary" />
            Filters
          </Typography>

          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} active`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            onClick={onClearFilter}
            size="small"
            startIcon={<ClearIcon />}
            variant="outlined"
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Filter Controls */}
      <Grid container spacing={2}>
        {/* Search */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search notifications"
            placeholder="Search by title or message..."
            value={filter.searchTerm || ''}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: filter.searchTerm && (
                <InputAdornment position="end">
                  <Button
                    onClick={() => handleFilterChange('searchTerm', '')}
                    size="small"
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <ClearIcon fontSize="small" />
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Status Filter */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filter.status || ''}
              onChange={e =>
                handleStatusChange(e.target.value as NotificationStatus | '')
              }
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="unread">Unread ({unreadCount})</MenuItem>
              <MenuItem value="read">
                Read ({totalCount - unreadCount})
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Type Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={filter.type || ''}
              onChange={e =>
                handleTypeChange(e.target.value as NotificationType | '')
              }
              label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {NOTIFICATION_TYPES.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Priority Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              value={filter.priority || ''}
              onChange={e =>
                handlePriorityChange(
                  e.target.value as 'low' | 'medium' | 'high' | ''
                )
              }
              label="Priority"
            >
              <MenuItem value="">All Priorities</MenuItem>
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <Box
          sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>Active filters:</strong>{' '}
            {[
              filter.status && `Status: ${filter.status}`,
              filter.type && `Type: ${filter.type}`,
              filter.priority && `Priority: ${filter.priority}`,
              filter.searchTerm && `Search: "${filter.searchTerm}"`,
            ]
              .filter(Boolean)
              .join(' • ')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NotificationFilters;
