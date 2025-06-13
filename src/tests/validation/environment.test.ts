/**
 * Environment validation tests
 * Ensures environment configuration works correctly
 */
import {
  config,
  isDevelopment,
  isStaging,
  isProduction,
} from '../../config/environment';

describe('Environment Validation', () => {
  test('environment configuration is loaded', () => {
    expect(config).toBeDefined();
    expect(config.environment).toBeDefined();
    expect(config.apiBaseUrl).toBeDefined();
    expect(config.sessionTimeoutMinutes).toBeDefined();
    expect(config.version).toBeDefined();
  });

  test('environment helpers work correctly', () => {
    // Test environment detection functions
    const envFunctions = [isDevelopment, isStaging, isProduction];
    const results = envFunctions.map(fn => fn());

    // Exactly one should be true
    const trueCount = results.filter(Boolean).length;
    expect(trueCount).toBe(1);
  });

  test('session timeout is valid', () => {
    expect(config.sessionTimeoutMinutes).toBeGreaterThan(0);
    expect(config.sessionTimeoutMinutes).toBeLessThan(1440); // Less than 24 hours
  });

  test('API URL is valid format', () => {
    expect(config.apiBaseUrl).toMatch(/^https?:\/\/.+/);
  });

  test('app version follows semantic versioning', () => {
    expect(config.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('boolean flags are properly typed', () => {
    expect(typeof config.analyticsId).toBe('string');
    expect(typeof config.enableDebugTools).toBe('boolean');
  });
});
