/**
 * Test suite for environment configuration
 * Tests environment variable parsing and validation
 */

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('loads default values when environment variables are not set', async () => {
    jest.resetModules();
    const { config } = await import('./environment');
    expect(config.environment).toBe('DEV');
    expect(config.apiBaseUrl).toBe('http://localhost:3001');
    expect(config.sessionTimeoutMinutes).toBe(30);
    expect(config.sessionWarningMinutes).toBe(5);
    expect(config.enableDebugTools).toBe(true);
    expect(config.version).toBe('1.0.0-test');
    expect(config.buildNumber).toBe('test-build');
  });

  test('loads values from environment variables', async () => {
    process.env.REACT_APP_ENVIRONMENT = 'STAGING';
    process.env.REACT_APP_API_BASE_URL = 'https://api.staging.example.com';
    process.env.REACT_APP_SESSION_TIMEOUT_MIN = '45';
    process.env.REACT_APP_SESSION_WARNING_MIN = '10';
    process.env.REACT_APP_ENABLE_DEBUG_TOOLS = 'false';
    process.env.REACT_APP_VERSION = '2.0.0';
    process.env.REACT_APP_BUILD_NUMBER = 'staging-123';
    jest.resetModules();
    const { config } = await import('./environment');
    expect(config.environment).toBe('STAGING');
    expect(config.apiBaseUrl).toBe('https://api.staging.example.com');
    expect(config.sessionTimeoutMinutes).toBe(45);
    expect(config.sessionWarningMinutes).toBe(10);
    expect(config.enableDebugTools).toBe(false);
    expect(config.version).toBe('2.0.0');
    expect(config.buildNumber).toBe('staging-123');
  });

  test('validates session timeout configuration', async () => {
    process.env.REACT_APP_ENVIRONMENT = 'DEV';
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001';
    process.env.REACT_APP_SESSION_TIMEOUT_MIN = '30';
    process.env.REACT_APP_SESSION_WARNING_MIN = '35';
    jest.resetModules();
    const { validateEnvironment } = await import('./environment');
    expect(() => validateEnvironment()).toThrow(
      'Session warning time must be less than session timeout time'
    );
  });

  test('validates API URL format', async () => {
    process.env.REACT_APP_ENVIRONMENT = 'DEV';
    process.env.REACT_APP_API_BASE_URL = 'invalid-url';
    process.env.REACT_APP_SESSION_TIMEOUT_MIN = '30';
    process.env.REACT_APP_SESSION_WARNING_MIN = '5';
    jest.resetModules();
    const { validateEnvironment } = await import('./environment');
    expect(() => validateEnvironment()).toThrow('Invalid API base URL');
  });

  test('environment detection functions work correctly', async () => {
    process.env.REACT_APP_ENVIRONMENT = 'DEV';
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001';
    jest.resetModules();
    const { isDevelopment, isProduction, isStaging } = await import(
      './environment'
    );
    expect(isDevelopment()).toBe(true);
    expect(isProduction()).toBe(false);
    expect(isStaging()).toBe(false);

    process.env.REACT_APP_ENVIRONMENT = 'STAGING';
    jest.resetModules();
    const {
      isDevelopment: isDev2,
      isProduction: isProd2,
      isStaging: isStag2,
    } = await import('./environment');
    expect(isDev2()).toBe(false);
    expect(isProd2()).toBe(false);
    expect(isStag2()).toBe(true);

    process.env.REACT_APP_ENVIRONMENT = 'PROD';
    jest.resetModules();
    const {
      isDevelopment: isDev3,
      isProduction: isProd3,
      isStaging: isStag3,
    } = await import('./environment');
    expect(isDev3()).toBe(false);
    expect(isProd3()).toBe(true);
    expect(isStag3()).toBe(false);
  });

  test('getEnvironmentDisplayName returns correct names', async () => {
    process.env.REACT_APP_ENVIRONMENT = 'DEV';
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001';
    jest.resetModules();
    const { getEnvironmentDisplayName } = await import('./environment');
    expect(getEnvironmentDisplayName()).toBe('Development');

    process.env.REACT_APP_ENVIRONMENT = 'STAGING';
    jest.resetModules();
    const { getEnvironmentDisplayName: getStagingName } = await import(
      './environment'
    );
    expect(getStagingName()).toBe('Staging');

    process.env.REACT_APP_ENVIRONMENT = 'PROD';
    jest.resetModules();
    const { getEnvironmentDisplayName: getProdName } = await import(
      './environment'
    );
    expect(getProdName()).toBe('Production');
  });

  test('boolean conversion works correctly', async () => {
    process.env.REACT_APP_ENABLE_DEBUG_TOOLS = 'false';
    process.env.REACT_APP_ENVIRONMENT = 'DEV';
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001';
    jest.resetModules();
    const { config } = await import('./environment');
    expect(config.enableDebugTools).toBe(false);
  });

  test('number conversion works correctly', async () => {
    process.env.REACT_APP_SESSION_TIMEOUT_MIN = '45';
    process.env.REACT_APP_ENVIRONMENT = 'DEV';
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001';
    jest.resetModules();
    const { config } = await import('./environment');
    expect(config.sessionTimeoutMinutes).toBe(45);
  });
});
