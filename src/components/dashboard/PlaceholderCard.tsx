/**
 * PlaceholderCard component - reusable blank widget for dashboard
 * Displays a coming soon message with consistent styling
 */
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Construction } from '@mui/icons-material';

export interface PlaceholderCardProps {
  title: string;
  subtitle?: string;
  minHeight?: number;
}

/**
 * Reusable placeholder widget component for dashboard sections that are not yet implemented
 * Provides consistent styling and "coming soon" messaging
 *
 * @param title - Main title for the placeholder widget
 * @param subtitle - Optional subtitle for additional context
 * @param minHeight - Minimum height in pixels (default: 200)
 */
const PlaceholderCard: React.FC<PlaceholderCardProps> = ({
  title,
  subtitle,
  minHeight = 200,
}) => {
  return (
    <Card
      sx={{
        minHeight: `${minHeight}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        border: '2px dashed',
        borderColor: 'divider',
        backgroundColor: 'grey.50',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'primary.50',
        },
      }}
    >
      <CardContent
        sx={{
          textAlign: 'center',
          py: 4,
          px: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Construction
            sx={{
              fontSize: 48,
              color: 'text.secondary',
              opacity: 0.7,
            }}
          />

          <Box>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: subtitle ? 1 : 0,
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {subtitle}
              </Typography>
            )}

            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
                opacity: 0.8,
              }}
            >
              Coming soon...
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PlaceholderCard;
