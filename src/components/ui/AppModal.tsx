/**
 * AppModal component - customized Material UI modal with consistent styling
 * Provides a reusable modal structure with header, content, and actions
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  closeButton?: boolean;
  dividers?: boolean;
}

const AppModal: React.FC<AppModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  closeButton = true,
  dividers = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      {(title || closeButton) && (
        <>
          <DialogTitle sx={{ m: 0, p: 3, pb: 2 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              {title && (
                <Typography
                  variant="h5"
                  component="div"
                  sx={{ fontWeight: 600 }}
                >
                  {title}
                </Typography>
              )}
              {closeButton && (
                <IconButton
                  aria-label="close"
                  onClick={onClose}
                  sx={{
                    ml: 2,
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
          {dividers && <Divider />}
        </>
      )}

      {/* Content */}
      <DialogContent
        sx={{
          p: 3,
          '&:first-of-type': {
            pt: title ? 3 : 3,
          },
        }}
      >
        {children}
      </DialogContent>

      {/* Actions */}
      {actions && (
        <>
          {dividers && <Divider />}
          <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>{actions}</DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default AppModal;
