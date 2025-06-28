/**
 * Lead Timeline Drawer Component
 * Shows chronological history of lead changes with lazy loading and JSON diff
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  Divider,
  Button,
  Alert,
  Skeleton,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  SwapHoriz as StatusIcon,
  Assignment as AssignIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Description as DocumentIcon,
  Add as AddIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import JsonView from '@uiw/react-json-view';
import { useGetLeadTimelineQuery } from '../../api/endpoints/leadEndpoints';
import { LoadingSpinner } from '../loading';
import type { Lead, LeadTimelineItem } from '../../types/lead.types';

/**
 * Timeline drawer props interface
 */
export interface LeadTimelineDrawerProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  initialLimit?: number;
}

/**
 * Get icon based on timeline action
 */
const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();

  if (actionLower.includes('status')) {
    return <StatusIcon />;
  } else if (actionLower.includes('created')) {
    return <AddIcon />;
  } else if (
    actionLower.includes('updated') ||
    actionLower.includes('edited')
  ) {
    return <UpdateIcon />;
  } else if (
    actionLower.includes('reassigned') ||
    actionLower.includes('assigned')
  ) {
    return <AssignIcon />;
  } else if (
    actionLower.includes('document') ||
    actionLower.includes('upload')
  ) {
    return <DocumentIcon />;
  } else {
    return <HistoryIcon />;
  }
};

/**
 * Get color based on timeline action
 */
const getActionColor = (
  action: string
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' => {
  const actionLower = action.toLowerCase();

  if (actionLower.includes('status')) {
    return 'primary';
  } else if (actionLower.includes('created')) {
    return 'success';
  } else if (
    actionLower.includes('updated') ||
    actionLower.includes('edited')
  ) {
    return 'info';
  } else if (
    actionLower.includes('reassigned') ||
    actionLower.includes('assigned')
  ) {
    return 'warning';
  } else if (
    actionLower.includes('document') ||
    actionLower.includes('upload')
  ) {
    return 'secondary';
  } else {
    return 'default';
  }
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (
  timestamp: string
): { relative: string; absolute: string } => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let relative: string;
  if (diffInSeconds < 60) {
    relative = 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    relative = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    relative = `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    relative = `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    relative = date.toLocaleDateString();
  }

  const absolute = date.toLocaleString();

  return { relative, absolute };
};

/**
 * Timeline item component
 */
interface TimelineItemProps {
  item: LeadTimelineItem;
  isLast: boolean;
}

const TimelineItemComponent: React.FC<TimelineItemProps> = ({
  item,
  isLast,
}) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  const hasDetails = item.details && Object.keys(item.details).length > 0;
  const hasChanges =
    item.details?.oldValue !== undefined &&
    item.details?.newValue !== undefined;
  const timestamps = formatTimestamp(item.timestamp);

  return (
    <ListItem
      sx={{
        flexDirection: 'column',
        alignItems: 'stretch',
        py: 2,
        px: 0,
        position: 'relative',
        '&::before': !isLast
          ? {
              content: '""',
              position: 'absolute',
              left: 28,
              top: 64,
              bottom: -16,
              width: 2,
              backgroundColor: 'divider',
              zIndex: 0,
            }
          : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {/* Timeline Icon */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
            mr: 2,
            backgroundColor: `${getActionColor(item.action)}.main`,
            color: `${getActionColor(item.action)}.contrastText`,
            zIndex: 1,
          }}
        >
          {getActionIcon(item.action)}
        </Avatar>

        {/* Timeline Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Action Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {item.action}
            </Typography>
            <Chip
              label={getActionColor(item.action)}
              size="small"
              color={getActionColor(item.action)}
              variant="outlined"
              sx={{ fontSize: '0.625rem', height: 20 }}
            />
          </Box>

          {/* Actor and Time */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
            title={timestamps.absolute}
          >
            by <strong>{item.actorName || item.actor}</strong> •{' '}
            {timestamps.relative}
          </Typography>

          {/* Field-specific information */}
          {item.details?.field && (
            <Box sx={{ mb: 1 }}>
              <Chip
                label={`Field: ${item.details.field}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            </Box>
          )}

          {/* Value Changes */}
          {hasChanges && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                Changes:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  p: 1,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Chip
                  label={String(item.details.oldValue)}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{
                    textDecoration: 'line-through',
                    opacity: 0.7,
                    maxWidth: 150,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mx: 0.5 }}
                >
                  →
                </Typography>
                <Chip
                  label={String(item.details.newValue)}
                  size="small"
                  color="success"
                  variant="filled"
                  sx={{
                    maxWidth: 150,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Reason/Notes */}
          {item.details?.reason && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                mb: 1,
                bgcolor: 'info.light',
                border: '1px solid',
                borderColor: 'info.main',
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                <strong>Note:</strong> {item.details.reason}
              </Typography>
            </Paper>
          )}

          {/* Document Information */}
          {item.details?.documentType && (
            <Box sx={{ mb: 1 }}>
              <Chip
                icon={<DocumentIcon />}
                label={`${item.details.documentType}${item.details.fileName ? `: ${item.details.fileName}` : ''}`}
                size="small"
                color="secondary"
                variant="filled"
              />
            </Box>
          )}

          {/* Detailed JSON View */}
          {hasDetails && (
            <Accordion
              expanded={expanded}
              onChange={(_, isExpanded) => setExpanded(isExpanded)}
              sx={{
                mt: 1,
                boxShadow: 'none',
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 2,
                  py: 1,
                  minHeight: 'auto',
                  '& .MuiAccordionSummary-content': { my: 0.5 },
                  bgcolor: 'grey.50',
                }}
              >
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  View detailed information ({Object.keys(item.details).length}{' '}
                  fields)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 1, pb: 2 }}>
                <JsonView
                  value={item.details}
                  collapsed={2}
                  style={{
                    backgroundColor: 'transparent',
                    fontSize: '12px',
                  }}
                />
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      </Box>
    </ListItem>
  );
};

/**
 * Loading skeleton for timeline items
 */
const TimelineSkeleton: React.FC = () => (
  <List sx={{ px: 2 }}>
    {Array.from({ length: 5 }).map((_, index) => (
      <ListItem key={index} sx={{ py: 2, px: 0 }}>
        <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            sx={{ mr: 2, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              width="80%"
              height={60}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </Box>
      </ListItem>
    ))}
  </List>
);

/**
 * Empty timeline state
 */
const EmptyTimeline: React.FC = () => (
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
    <TimelineIcon
      sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }}
    />
    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
      No timeline entries
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ textAlign: 'center', maxWidth: 300 }}
    >
      Timeline entries will appear here as actions are performed on this lead.
    </Typography>
  </Box>
);

/**
 * Lead Timeline Drawer Component
 */
export const LeadTimelineDrawer: React.FC<LeadTimelineDrawerProps> = ({
  open,
  onClose,
  lead,
  initialLimit = 50,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [limit, setLimit] = useState(initialLimit);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Query for timeline data
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetLeadTimelineQuery(
      { leadId: lead?.id || '', limit },
      {
        skip: !open || !lead?.id,
        refetchOnMountOrArgChange: true,
      }
    );

  const timeline = data?.data.timeline || [];
  const total = data?.data.total || 0;
  const hasMore = timeline.length < total;

  /**
   * Handle close with escape key
   */
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [open, onClose]);

  /**
   * Focus management for accessibility
   */
  useEffect(() => {
    if (open && drawerRef.current) {
      // Focus the drawer content for screen readers
      const firstFocusable = drawerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    }
  }, [open]);

  /**
   * Load more timeline entries
   */
  const handleLoadMore = useCallback(() => {
    if (!hasMore || isFetching) return;
    setLimit(prev => prev + 25);
  }, [hasMore, isFetching]);

  /**
   * Refresh timeline
   */
  const handleRefresh = useCallback(() => {
    setLimit(initialLimit);
    refetch();
  }, [initialLimit, refetch]);

  if (!lead) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 480,
          maxWidth: '100vw',
        },
        ref: drawerRef,
      }}
      ModalProps={{
        keepMounted: false, // Better performance
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lead Timeline
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleRefresh}
              disabled={isFetching}
              size="small"
              aria-label="Refresh timeline"
            >
              <RefreshIcon />
            </IconButton>
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close timeline drawer"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Lead Info */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {lead.leadId} - {lead.customerName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={lead.status}
              size="small"
              color="primary"
              variant="filled"
            />
            {lead.territory && (
              <Chip label={lead.territory} size="small" variant="outlined" />
            )}
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading && timeline.length === 0 ? (
          <TimelineSkeleton />
        ) : isError ? (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleRefresh}
                  startIcon={<RefreshIcon />}
                >
                  Retry
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Failed to load timeline
              </Typography>
              <Typography variant="body2">
                {(error as any)?.data?.message ||
                  'An error occurred while loading the timeline.'}
              </Typography>
            </Alert>
          </Box>
        ) : timeline.length === 0 ? (
          <EmptyTimeline />
        ) : (
          <>
            <List sx={{ px: 2, py: 1 }}>
              {timeline.map((item, index) => (
                <TimelineItemComponent
                  key={item.id}
                  item={item}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </List>

            {/* Load More */}
            {hasMore && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  variant="outlined"
                  startIcon={
                    isFetching ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <HistoryIcon />
                    )
                  }
                >
                  {isFetching
                    ? 'Loading...'
                    : `Load More (${timeline.length} of ${total})`}
                </Button>
              </Box>
            )}

            {/* Loading overlay for pagination */}
            {isFetching && timeline.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  bgcolor: 'primary.main',
                  opacity: 0.7,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.4 },
                    '50%': { opacity: 0.8 },
                    '100%': { opacity: 0.4 },
                  },
                }}
              />
            )}
          </>
        )}
      </Box>

      {/* Footer Info */}
      {timeline.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: 'center', display: 'block' }}
          >
            Showing {timeline.length} of {total} timeline entries
            {hasMore && ' • Scroll up to load more'}
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default LeadTimelineDrawer;
