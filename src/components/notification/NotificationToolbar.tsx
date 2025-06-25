/**
 * Notification Toolbar Component
 * Provides bulk actions and status information for notifications
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Checkbox,
  Chip,
  Tooltip,
  Alert,
  Collapse,
} from '@mui/material';
import {
  SelectAll as SelectAllIcon,
  DoneAll as DoneAllIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { AppConfirmDialog } from '../ui';

/**
 * Toolbar props interface
 */
export interface NotificationToolbarProps {
  selectedCount: number;
  totalCount: number;
  unreadCount: number;
  onSelectAll: (selected: boolean) => void;
  onMarkSelectedRead: () => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

/**
 * Notification Toolbar Component
 */
export const NotificationToolbar: React.FC<NotificationToolbarProps> = ({
  selectedCount,
  totalCount,
  unreadCount,
  onSelectAll,
  onMarkSelectedRead,
  onMarkAllRead,
  onRefresh,
  isLoading = false,
}) => {
  const [showMarkAllDialog, setShowMarkAllDialog] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  /**
   * Handle select all checkbox
   */
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSelectAll(event.target.checked);
  };

  /**
   * Handle mark selected as read
   */
  const handleMarkSelectedRead = async () => {
    if (selectedCount === 0) return;

    try {
      await onMarkSelectedRead();
    } catch (error) {
      console.error('Failed to mark selected notifications as read:', error);
    }
  };

  /**
   * Handle mark all as read with confirmation
   */
  const handleMarkAllReadConfirm = async () => {
    setIsMarkingAllRead(true);
    try {
      await onMarkAllRead();
      setShowMarkAllDialog(false);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  // Don't show toolbar if no notifications
  if (totalCount === 0) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          bgcolor: selectedCount > 0 ? 'action.selected' : 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'background-color 0.2s ease',
        }}
      >
        {/* Left side - Selection controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Select All Checkbox */}
          <Tooltip title={isAllSelected ? 'Deselect all' : 'Select all'}>
            <Checkbox
              checked={isAllSelected}
              indeterminate={isPartiallySelected}
              onChange={handleSelectAll}
              size="small"
              color="primary"
              icon={<SelectAllIcon />}
              checkedIcon={<SelectAllIcon />}
              indeterminateIcon={<SelectAllIcon />}
            />
          </Tooltip>

          {/* Selection Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedCount > 0 ? (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {selectedCount} selected
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {totalCount} notification{totalCount !== 1 ? 's' : ''}
              </Typography>
            )}

            {/* Unread Count */}
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontSize: '0.625rem' }}
              />
            )}
          </Box>
        </Box>

        {/* Right side - Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Mark Selected as Read */}
          {selectedCount > 0 && (
            <Button
              onClick={handleMarkSelectedRead}
              size="small"
              startIcon={<CheckCircleIcon />}
              disabled={isLoading}
              variant="outlined"
              color="primary"
            >
              Mark {selectedCount} as Read
            </Button>
          )}

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <Button
              onClick={() => setShowMarkAllDialog(true)}
              size="small"
              startIcon={<DoneAllIcon />}
              disabled={isLoading}
              variant="outlined"
              color="success"
            >
              Mark All Read
            </Button>
          )}

          {/* Refresh Button */}
          <Tooltip title="Refresh notifications">
            <Button
              onClick={onRefresh}
              size="small"
              startIcon={<RefreshIcon />}
              disabled={isLoading}
              variant="outlined"
              sx={{ minWidth: 'auto', px: 1.5 }}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Bulk Action Info */}
      <Collapse in={selectedCount > 0}>
        <Alert
          severity="info"
          sx={{
            borderRadius: 0,
            border: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2">
            {selectedCount} notification{selectedCount !== 1 ? 's' : ''}{' '}
            selected. Use the buttons above to perform bulk actions.
          </Typography>
        </Alert>
      </Collapse>

      {/* Mark All Read Confirmation Dialog */}
      <AppConfirmDialog
        open={showMarkAllDialog}
        title="Mark All Notifications as Read"
        message={`Are you sure you want to mark all ${unreadCount} unread notifications as read? This action cannot be undone.`}
        confirmText="Mark All Read"
        cancelText="Cancel"
        severity="info"
        loading={isMarkingAllRead}
        onConfirm={handleMarkAllReadConfirm}
        onCancel={() => setShowMarkAllDialog(false)}
        details={`This will mark ${unreadCount} unread notifications as read.`}
      />
    </>
  );
};

export default NotificationToolbar;
