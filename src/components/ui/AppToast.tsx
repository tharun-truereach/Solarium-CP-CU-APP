/**
 * App Toast Component
 * Consistent toast notifications using Material-UI Snackbar
 */

import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, IconButton, Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * Toast severity levels
 */
export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast position options
 */
export type ToastPosition = {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
};

/**
 * Toast props interface
 */
export interface AppToastProps {
  open: boolean;
  message: string;
  severity?: ToastSeverity;
  title?: string;
  duration?: number;
  position?: ToastPosition;
  showCloseButton?: boolean;
  action?: React.ReactNode;
  onClose: () => void;
}

/**
 * Slide transition component
 */
const SlideTransition = React.forwardRef<
  HTMLDivElement,
  TransitionProps & { children: React.ReactElement }
>((props, ref) => {
  return (
    <Slide
      {...props}
      direction="up"
      ref={ref}
      appear={false}
      enter={true}
      exit={true}
      in={true}
    />
  );
});

SlideTransition.displayName = 'SlideTransition';

/**
 * App Toast Component
 */
const AppToast: React.FC<AppToastProps> = ({
  open,
  message,
  severity = 'info',
  title,
  duration = 6000,
  position = { vertical: 'bottom', horizontal: 'left' },
  showCloseButton = true,
  action,
  onClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(open);

  // Sync internal state with prop
  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  /**
   * Handle close
   */
  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setInternalOpen(false);
    // Delay the onClose callback to allow slide-out animation
    setTimeout(() => {
      onClose();
    }, 150);
  };

  /**
   * Auto-hide duration (null means no auto-hide)
   */
  const autoHideDuration = duration > 0 ? duration : null;

  return (
    <Snackbar
      open={internalOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={position}
      TransitionComponent={SlideTransition}
      sx={{
        '& .MuiSnackbarContent-root': {
          minWidth: 'auto',
        },
      }}
    >
      <Alert
        severity={severity}
        variant="filled"
        {...(showCloseButton && { onClose: handleClose })}
        action={
          action ||
          (showCloseButton ? (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          ) : undefined)
        }
        sx={{
          minWidth: 300,
          maxWidth: 500,
          boxShadow: 3,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        {title && (
          <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>{title}</AlertTitle>
        )}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AppToast;
