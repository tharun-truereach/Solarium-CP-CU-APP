/**
 * Settings components barrel file
 * Centralizes all settings-related component exports
 */

// Main settings page
export { default as SettingsPage } from '../../pages/settings/SettingsPage';

// Settings form components
export { default as GeneralSettingsForm } from './GeneralSettingsForm';
export { default as FeatureFlagsForm } from './FeatureFlagsForm';
export { default as ThresholdSettingsForm } from './ThresholdSettingsForm';

// Settings utilities and schemas
export * from './schemas';

// Settings hooks
export { useSettingsForm } from '../../hooks/useSettingsForm';

// Settings-specific UI components (to be implemented if needed)
// export { default as SettingCard } from './SettingCard';
// export { default as FeatureFlagToggle } from './FeatureFlagToggle';
// export { default as ThresholdSlider } from './ThresholdSlider';

export { default as AuditLogTable } from './AuditLogTable';

console.log('⚙️ Settings components barrel loaded');
