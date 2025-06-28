/**
 * Lead Filters Component
 * Provides comprehensive filtering interface for leads
 */

import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useLeadAccess } from '../../hooks/useLeadAccess';
import { LEAD_CONFIG, TERRITORIES } from '../../utils/constants';
import type { LeadQuery, LeadStatus, LeadOrigin } from '../../types/lead.types';
import type { Territory } from '../../types/user.types';

/**
 * Filter component props interface
 */
export interface LeadFiltersProps {
  filters: LeadQuery;
  onFiltersChange: (filters: LeadQuery) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Lead status options
 */
const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'New Lead', label: 'New Lead' },
  { value: 'In Discussion', label: 'In Discussion' },
  { value: 'Physical Meeting Assigned', label: 'Physical Meeting Assigned' },
  { value: 'Customer Accepted', label: 'Customer Accepted' },
  { value: 'Won', label: 'Won' },
  { value: 'Pending at Solarium', label: 'Pending at Solarium' },
  { value: 'Under Execution', label: 'Under Execution' },
  { value: 'Executed', label: 'Executed' },
  { value: 'Not Responding', label: 'Not Responding' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Other Territory', label: 'Other Territory' },
];

/**
 * Origin options
 */
const ORIGIN_OPTIONS: { value: LeadOrigin; label: string }[] = [
  { value: 'CP', label: 'Channel Partner' },
  { value: 'Customer', label: 'Customer' },
  { value: 'Admin', label: 'Admin' },
  { value: 'KAM', label: 'KAM' },
];

/**
 * Lead Filters Component
 */
export const LeadFilters: React.FC<LeadFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  totalCount,
  filteredCount,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { isAdmin, userTerritories } = useLeadAccess();

  /**
   * Handle filter field changes
   */
  const handleFilterChange = (field: keyof LeadQuery, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined, // Convert empty strings to undefined
    });
  };

  /**
   * Handle search term change
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', event.target.value);
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.origin ||
      filters.territory ||
      filters.state ||
      filters.assignedCP ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.followUpDateFrom ||
      filters.followUpDateTo
  );

  /**
   * Get active filter count
   */
  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.origin,
    filters.territory,
    filters.state,
    filters.assignedCP,
    filters.dateFrom,
    filters.dateTo,
    filters.followUpDateFrom,
    filters.followUpDateTo,
  ].filter(Boolean).length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Accordion
        expanded={!isCollapsed}
        {...(onToggleCollapse && {
          onChange: (_event, _expanded) => onToggleCollapse(),
        })}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="lead-filters-content"
          id="lead-filters-header"
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Filters
              </Typography>
            </Box>

            {activeFilterCount > 0 && (
              <Chip
                label={`${activeFilterCount} active`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}

            <Box
              sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Typography variant="body2" color="text.secondary">
                {filteredCount} of {totalCount} leads
              </Typography>

              {hasActiveFilters && (
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    onClearFilters();
                  }}
                  size="small"
                  startIcon={<ClearIcon />}
                  variant="outlined"
                >
                  Clear All
                </Button>
              )}
            </Box>
          </Box>
        </AccordionSummary>

        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search leads"
                placeholder="Search by name, phone, or lead ID..."
                value={filters.search || ''}
                onChange={handleSearchChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <Button
                        onClick={() => handleFilterChange('search', '')}
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
                  value={filters.status || ''}
                  onChange={e => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  {LEAD_STATUS_OPTIONS.map(({ value, label }) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Origin Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Origin</InputLabel>
                <Select
                  value={filters.origin || ''}
                  onChange={e => handleFilterChange('origin', e.target.value)}
                  label="Origin"
                >
                  <MenuItem value="">All</MenuItem>
                  {ORIGIN_OPTIONS.map(({ value, label }) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Territory Filter - Show only for Admin or filter by user territories for KAM */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Territory</InputLabel>
                <Select
                  value={filters.territory || ''}
                  onChange={e =>
                    handleFilterChange('territory', e.target.value)
                  }
                  label="Territory"
                >
                  <MenuItem value="">All</MenuItem>
                  {(isAdmin ? TERRITORIES : userTerritories).map(territory => (
                    <MenuItem key={territory} value={territory}>
                      {territory}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* State Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="State"
                placeholder="e.g., Maharashtra"
                value={filters.state || ''}
                onChange={e => handleFilterChange('state', e.target.value)}
                size="small"
              />
            </Grid>

            {/* Date Created From */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Created From"
                value={filters.dateFrom ? new Date(filters.dateFrom) : null}
                onChange={date =>
                  handleFilterChange(
                    'dateFrom',
                    date ? date.toISOString().split('T')[0] : ''
                  )
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            {/* Date Created To */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Created To"
                value={filters.dateTo ? new Date(filters.dateTo) : null}
                onChange={date =>
                  handleFilterChange(
                    'dateTo',
                    date ? date.toISOString().split('T')[0] : ''
                  )
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            {/* Follow-up Date From */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Follow-up From"
                value={
                  filters.followUpDateFrom
                    ? new Date(filters.followUpDateFrom)
                    : null
                }
                onChange={date =>
                  handleFilterChange(
                    'followUpDateFrom',
                    date ? date.toISOString().split('T')[0] : ''
                  )
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            {/* Follow-up Date To */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Follow-up To"
                value={
                  filters.followUpDateTo
                    ? new Date(filters.followUpDateTo)
                    : null
                }
                onChange={date =>
                  handleFilterChange(
                    'followUpDateTo',
                    date ? date.toISOString().split('T')[0] : ''
                  )
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>Active filters:</strong>{' '}
                {[
                  filters.search && `Search: "${filters.search}"`,
                  filters.status && `Status: ${filters.status}`,
                  filters.origin && `Origin: ${filters.origin}`,
                  filters.territory && `Territory: ${filters.territory}`,
                  filters.state && `State: ${filters.state}`,
                  filters.dateFrom && `Created after: ${filters.dateFrom}`,
                  filters.dateTo && `Created before: ${filters.dateTo}`,
                  filters.followUpDateFrom &&
                    `Follow-up after: ${filters.followUpDateFrom}`,
                  filters.followUpDateTo &&
                    `Follow-up before: ${filters.followUpDateTo}`,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </LocalizationProvider>
  );
};

export default LeadFilters;
