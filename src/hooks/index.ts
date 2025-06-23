/**
 * Hooks barrel export
 * Centralizes custom hook exports
 */
export { useLoadingState } from './useLoadingState';
export { useHttpClient } from './useHttpClient';
export { useRoleVisibility } from './useRoleVisibility';
export { useErrorHandler } from './useErrorHandler';
export { useTerritoryFilter } from './useTerritoryFilter';
export {
  useDashboardMetrics as default,
  useDashboardMetricsWithRefresh,
  useDashboardMetricsByRole,
} from './useDashboardMetrics';
export { useAuditLogs } from './useAuditLogs';

// Export types
export type {
  UseDashboardMetricsReturn,
  UseDashboardMetricsOptions,
} from './useDashboardMetrics';

export { useAppDispatch, useAppSelector } from '../store/hooks';
