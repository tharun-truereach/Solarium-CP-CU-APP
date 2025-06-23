/**
 * Main components barrel file for Solarium Web Portal
 * Re-exports all component modules for easy importing
 */

// Error handling components
export {
  ErrorBoundary,
  ErrorFallback,
  FeatureErrorBoundary,
  ErrorTestComponent,
  GlobalErrorHandler,
} from './error';

// Loading components
export {
  LoadingOverlay,
  LoadingSpinner,
  SkeletonLoader,
  PageLoader,
  DataLoader,
} from './loading';

// UI components
export { AppButton, AppModal, AppTextField, AppCard } from './ui';

// Dashboard components
export { PlaceholderCard, QuickActionTile } from './dashboard';

// Global components
export { default as GlobalErrorToast } from './GlobalErrorToast';
export { default as GlobalLoading } from './GlobalLoading';
export { default as SessionTimeout } from './SessionTimeout';
export { default as EnvironmentBanner } from './EnvironmentBanner';

// Type exports
export type {
  AppButtonProps,
  AppModalProps,
  AppTextFieldProps,
  AppCardProps,
} from './ui';
export type { PlaceholderCardProps, QuickActionTileProps } from './dashboard';

// Settings components
export * from './settings';

// Environment and utility components
export { default as DebugConsole } from './DebugConsole';

// Feature flag components
export {
  FeatureFlagProvider,
  WithFeatureFlag,
  FeatureFlagDebugger,
} from '../contexts/FeatureFlagContext';

console.log('📦 Components barrel loaded');
