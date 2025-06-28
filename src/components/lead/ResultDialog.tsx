/**
 * Result Dialog Component
 * Shows success/failure results for bulk operations
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

/**
 * Component props
 */
export interface ResultDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  successCount: number;
  failedItems: { id: string; reason: string }[];
  operation: string; // 'updated', 'reassigned', 'imported', etc.
}

/**
 * Result Dialog Component
 */
export const ResultDialog: React.FC<ResultDialogProps> = ({
  open,
  onClose,
  title,
  successCount,
  failedItems,
  operation,
}) => {
  const failedCount = failedItems.length;
  const totalCount = successCount + failedCount;
  const hasFailures = failedCount > 0;
  const hasSuccesses = successCount > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {hasFailures && hasSuccesses ? (
            <WarningIcon color="warning" sx={{ fontSize: 32 }} />
          ) : hasFailures ? (
            <ErrorIcon color="error" sx={{ fontSize: 32 }} />
          ) : (
            <SuccessIcon color="success" sx={{ fontSize: 32 }} />
          )}

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasFailures && hasSuccesses
                ? `Partial success: ${successCount} of ${totalCount} leads ${operation}`
                : hasFailures
                  ? `Failed to ${operation.replace('ed', '')} any leads`
                  : `All ${totalCount} leads ${operation} successfully`}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Summary */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {hasSuccesses && (
            <Chip
              icon={<SuccessIcon />}
              label={`${successCount} Successful`}
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}

          {hasFailures && (
            <Chip
              icon={<ErrorIcon />}
              label={`${failedCount} Failed`}
              color="error"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Success Message */}
        {hasSuccesses && (
          <Alert severity="success" sx={{ mb: hasFailures ? 2 : 0 }}>
            <Typography variant="body2">
              Successfully {operation} <strong>{successCount}</strong> lead
              {successCount !== 1 ? 's' : ''}.
            </Typography>
          </Alert>
        )}

        {/* Failure Details */}
        {hasFailures && (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>{failedCount}</strong> lead
                {failedCount !== 1 ? 's' : ''} could not be {operation}. See
                details below:
              </Typography>
            </Alert>

            <Box
              sx={{
                maxHeight: 300,
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <List dense>
                {failedItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {item.id}
                            </Typography>
                            <Chip
                              label="Failed"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontSize: '0.625rem', height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="error">
                            {item.reason}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < failedItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color={hasFailures && !hasSuccesses ? 'error' : 'primary'}
          sx={{ minWidth: 100 }}
        >
          {hasFailures && hasSuccesses ? 'Continue' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResultDialog;
