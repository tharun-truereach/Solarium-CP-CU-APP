/**
 * AppCard component - customized Material UI card with consistent styling
 * Provides a reusable card structure with optional header and actions
 */
import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Divider,
  CardProps,
} from '@mui/material';

export interface AppCardProps extends CardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  dividers?: boolean;
  hover?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  actions,
  padding = 'medium',
  dividers = false,
  hover = false,
  sx,
  ...props
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return 2;
      case 'medium':
        return 3;
      case 'large':
        return 4;
      default:
        return 3;
    }
  };

  const paddingValue = getPadding();

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        ...(hover && {
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <>
          <CardHeader
            title={
              title && (
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: 600 }}
                >
                  {title}
                </Typography>
              )
            }
            subheader={
              subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )
            }
            action={headerAction}
            sx={{ pb: dividers ? 2 : 1 }}
          />
          {dividers && <Divider />}
        </>
      )}

      {/* Content */}
      <CardContent sx={{ p: paddingValue, pt: title ? 2 : paddingValue }}>
        {children}
      </CardContent>

      {/* Actions */}
      {actions && (
        <>
          {dividers && <Divider />}
          <CardActions sx={{ p: paddingValue, pt: 2, gap: 1 }}>
            {actions}
          </CardActions>
        </>
      )}
    </Card>
  );
};

export default AppCard;
