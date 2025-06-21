/**
 * QuickActionTile component - individual action button for dashboard quick actions
 * Provides consistent styling and interaction patterns for navigation buttons
 */
import React from 'react';
import { Button, ButtonProps } from '@mui/material';

export interface QuickActionTileProps extends Omit<ButtonProps, 'children'> {
  label: string;
  icon: React.ReactElement;
  onClick: () => void;
}

/**
 * Individual quick action button component for dashboard navigation
 * Provides consistent styling and hover effects for action buttons
 *
 * @param label - Button text label
 * @param icon - Icon element to display
 * @param onClick - Click handler function
 * @param props - Additional MUI Button props
 */
const QuickActionTile: React.FC<QuickActionTileProps> = ({
  label,
  icon,
  onClick,
  ...props
}) => {
  return (
    <Button
      variant="outlined"
      fullWidth
      onClick={onClick}
      startIcon={icon}
      sx={{
        justifyContent: 'flex-start',
        py: 1.5,
        px: 2,
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 500,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'primary.50',
          borderColor: 'primary.main',
          color: 'primary.main',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          '& .MuiSvgIcon-root': {
            transform: 'scale(1.1)',
          },
        },
        '& .MuiSvgIcon-root': {
          transition: 'transform 0.2s ease-in-out',
        },
      }}
      {...props}
    >
      {label}
    </Button>
  );
};

export default QuickActionTile;
