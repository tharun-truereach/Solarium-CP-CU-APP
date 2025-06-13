/**
 * Package scripts for validation and testing
 * Extended npm scripts for comprehensive validation
 */
module.exports = {
  scripts: {
    validate: {
      description: 'Run all validation checks',
      script:
        'npm run typecheck && npm run lint && npm run test:ci && npm run build:production',
    },
    'validate:foundation': {
      description: 'Run foundation-specific validation',
      script: 'node -r ts-node/register src/tests/testRunner.ts',
    },
    'test:integration': {
      description: 'Run integration tests',
      script: 'jest --config=jest.config.cjs --testPathPattern=integration',
    },
    'test:validation': {
      description: 'Run validation tests',
      script: 'jest --config=jest.config.cjs --testPathPattern=validation',
    },
    'test:accessibility': {
      description: 'Run accessibility tests',
      script: 'jest --config=jest.config.cjs --testPathPattern=accessibility',
    },
    'test:performance': {
      description: 'Run performance tests',
      script: 'jest --config=jest.config.cjs --testPathPattern=performance',
    },
  },
};
