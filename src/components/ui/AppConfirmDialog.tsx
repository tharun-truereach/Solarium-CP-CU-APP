/**
 * App Confirm Dialog Component
 * Reusable confirmation dialog with consistent styling and behavior
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  HelpOutline as QuestionIcon,
} from '@mui/icons-material';
import AppButton from './AppButton';

/**
 * Confirmation dialog severity levels
 */
export type ConfirmDialogSeverity = 'warning' | 'error' | 'info' | 'question';

/**
 * Confirmation dialog props
 */
export interface AppConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  severity?: ConfirmDialogSeverity;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hideCloseButton?: boolean;
  details?: string;
}

/**
 * Get icon based on severity
 */
const getSeverityIcon = (severity: ConfirmDialogSeverity) => {
  switch (severity) {
    case 'warning':
      return <WarningIcon sx={{ fontSize: 24 }} />;
    case 'error':
      return <ErrorIcon sx={{ fontSize: 24 }} />;
    case 'info':
      return <InfoIcon sx={{ fontSize: 24 }} />;
    case 'question':
    default:
      return <QuestionIcon sx={{ fontSize: 24 }} />;
  }
};

/**
 * Get color based on severity
 */
const getSeverityColor = (severity: ConfirmDialogSeverity) => {
  switch (severity) {
    case 'warning':
      return 'warning.main';
    case 'error':
      return 'error.main';
    case 'info':
      return 'info.main';
    case 'question':
    default:
      return 'primary.main';
  }
};

/**
 * App Confirm Dialog Component
 */
const AppConfirmDialog: React.FC<AppConfirmDialogProps> = ({
  open,
  title,
  message,
  severity = 'question',
  confirmText = 'Yes',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  loading = false,
  onConfirm,
  onCancel,
  onClose,
  maxWidth = 'sm',
  hideCloseButton = false,
  details,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!loading) {
      onClose ? onClose() : onCancel();
    }
  };

  /**
   * Handle confirm action
   */
  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: '90vh',
        },
      }}
      // Disable backdrop click when loading
      disableEscapeKeyDown={loading}
      {...(!loading && { onClose: handleClose })}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ color: getSeverityColor(severity) }}>
              {getSeverityIcon(severity)}
            </Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>

          {!hideCloseButton && (
            <IconButton
              aria-label="close"
              onClick={handleClose}
              disabled={loading}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Typography
          variant="body1"
          sx={{ mb: details ? 2 : 0, lineHeight: 1.6 }}
        >
          {message}
        </Typography>

        {details && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {details}
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
        <AppButton
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </AppButton>

        <AppButton
          variant={
            severity === 'error'
              ? 'danger'
              : confirmColor === 'warning'
                ? 'secondary'
                : confirmColor === 'error'
                  ? 'danger'
                  : confirmColor
          }
          onClick={handleConfirm}
          loading={loading}
          sx={{ minWidth: 100 }}
        >
          {confirmText}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default AppConfirmDialog;
