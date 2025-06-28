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
export { useMyProfile } from './useMyProfile';

// Export types
export type {
  UseDashboardMetricsReturn,
  UseDashboardMetricsOptions,
} from './useDashboardMetrics';
export type { UseMyProfileReturn, ProfileField } from './useMyProfile';

export { useAppDispatch, useAppSelector } from '../store/hooks';
export { useBulkLeadActions } from './useBulkLeadActions';
export { useChannelPartners } from './useChannelPartners';
export type { ChannelPartner } from './useChannelPartners';
export { useCSVImport } from './useCSVImport';
export { useCSVExport } from './useCSVExport';
