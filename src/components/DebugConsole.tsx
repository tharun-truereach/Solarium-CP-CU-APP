/**
 * Debug console for development mode
 * Shows authentication status and API call information
 */
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Alert,
} from '@mui/material';
import {
  BugReport,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DebugConsole: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const { user, isAuthenticated, token, isLoading, error } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          bgcolor: 'grey.900',
          color: 'grey.100',
          border: '1px solid',
          borderColor: 'grey.700',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            cursor: 'pointer',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <BugReport sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ flex: 1 }}>
            Debug Console
          </Typography>
          <IconButton size="small" sx={{ color: 'inherit' }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box
            sx={{
              p: 2,
              pt: 0,
              borderTop: '1px solid',
              borderColor: 'grey.700',
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                Auth Status:
              </Typography>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
              >
                {isAuthenticated ? (
                  <Chip
                    label="Authenticated"
                    size="small"
                    color="success"
                    icon={<CheckCircle />}
                  />
                ) : (
                  <Chip
                    label="Not Authenticated"
                    size="small"
                    color="error"
                    icon={<Error />}
                  />
                )}
                {isLoading && (
                  <Chip label="Loading..." size="small" color="warning" />
                )}
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2, fontSize: '0.75rem' }}>
                {error}
              </Alert>
            )}

            {user && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  User Info:
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="body2">
                    {user.name} ({user.email})
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'grey.500' }}>
                    Role: {user.role} | ID: {user.id}
                  </Typography>
                </Box>
              </Box>
            )}

            {token && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  Token:
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    wordBreak: 'break-all',
                    color: 'grey.500',
                    mt: 0.5,
                  }}
                >
                  {token.substring(0, 50)}...
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                MSW Status:
              </Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                Mock APIs Active
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default DebugConsole;
