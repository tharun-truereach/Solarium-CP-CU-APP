import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, AlertTitle, IconButton, Slide } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { clearError, selectErrorToast } from '../store/slices/uiSlice';
import { TransitionProps } from '@mui/material/transitions';

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

const GlobalErrorToast: React.FC = () => {
  const dispatch = useAppDispatch();
  const errorToast = useAppSelector(selectErrorToast);
  const [lastErrorId, setLastErrorId] = useState<string>('');

  const errorId = `${errorToast.message}-${errorToast.severity}`;
  const isDuplicateError = errorId === lastErrorId && errorToast.show;

  useEffect(() => {
    if (errorToast.show && !isDuplicateError) {
      setLastErrorId(errorId);

      const timeoutId = setTimeout(() => {
        setLastErrorId('');
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [errorToast.show, errorId, isDuplicateError]);

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(clearError());
  };

  const handleActionClick = () => {
    dispatch(clearError());
  };

  if (!errorToast.show || isDuplicateError) {
    return null;
  }

  const getAlertProps = () => {
    switch (errorToast.severity) {
      case 'error':
        return {
          severity: 'error' as const,
          title: 'Error',
          autoHideDuration: null,
        };
      case 'warning':
        return {
          severity: 'warning' as const,
          title: 'Warning',
          autoHideDuration: 8000,
        };
      case 'info':
        return {
          severity: 'info' as const,
          title: 'Information',
          autoHideDuration: 6000,
        };
      case 'success':
        return {
          severity: 'success' as const,
          title: 'Success',
          autoHideDuration: 4000,
        };
      default:
        return {
          severity: 'error' as const,
          title: 'Error',
          autoHideDuration: null,
        };
    }
  };

  const alertProps = getAlertProps();

  return (
    <Snackbar
      open={errorToast.show}
      autoHideDuration={alertProps.autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
      sx={{
        mt: 8,
        maxWidth: { xs: '90%', sm: 400 },
      }}
    >
      <Alert
        severity={alertProps.severity}
        variant="filled"
        onClose={handleActionClick}
        sx={{
          width: '100%',
          alignItems: 'flex-start',
          '& .MuiAlert-message': {
            paddingTop: '2px',
          },
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleActionClick}
            sx={{ marginTop: '-4px' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle sx={{ mb: 0.5 }}>{alertProps.title}</AlertTitle>
        {errorToast.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalErrorToast;
