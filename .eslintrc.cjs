module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:security/recommended',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.js',
    'vite.config.ts',
    '.eslintrc.cjs',
    'jest.config.js',
    'scripts/qa-check.js',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: ['react-refresh', 'security'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-no-csrf-before-method-override': 'error',

    // Prevent dangerous HTML injection
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',

    // Prevent XSS through dangerouslySetInnerHTML
    'no-restricted-properties': [
      'error',
      {
        object: 'React',
        property: 'dangerouslySetInnerHTML',
        message:
          'dangerouslySetInnerHTML is not allowed for security reasons. Use safe alternatives.',
      },
      {
        property: 'dangerouslySetInnerHTML',
        message:
          'dangerouslySetInnerHTML is not allowed for security reasons. Use safe alternatives.',
      },
      {
        object: 'window',
        property: 'eval',
        message: 'eval() is not allowed for security reasons.',
      },
      {
        object: 'global',
        property: 'eval',
        message: 'eval() is not allowed for security reasons.',
      },
      {
        object: 'window',
        property: 'Function',
        message: 'Function constructor is not allowed for security reasons.',
      },
    ],

    // Prevent token exposure
    'no-restricted-globals': [
      'error',
      {
        name: 'localStorage',
        message:
          'Direct localStorage access is restricted. Use the secure storage utilities instead.',
      },
      {
        name: 'sessionStorage',
        message:
          'Direct sessionStorage access is restricted. Use the secure storage utilities instead.',
      },
    ],

    // Prevent console.log in production
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

    // Prevent debugger statements
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

    // Prevent alert/confirm/prompt
    'no-alert': 'error',

    // Prevent with statements
    'no-with': 'error',

    // Prevent eval and eval-like functions
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Prevent script injection
    'no-script-url': 'error',

    // TypeScript specific security rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',

    // Prevent prototype pollution
    'no-prototype-builtins': 'error',

    // Prevent RegExp DoS
    'no-invalid-regexp': 'error',

    // Prevent potential XSS in URLs
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/^(javascript|data|vbscript):/i]',
        message:
          'Potential XSS: javascript:, data:, and vbscript: URLs are not allowed',
      },
      {
        selector: 'TemplateElement[value.raw=/^(javascript|data|vbscript):/i]',
        message:
          'Potential XSS: javascript:, data:, and vbscript: URLs are not allowed in template literals',
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        // Relax some rules for test files
        'no-console': 'off',
        'security/detect-object-injection': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['src/store/persistence/encryptedTransform.ts'],
      rules: {
        // Allow controlled localStorage usage in secure storage utilities
        'no-restricted-globals': 'off',
      },
    },
  ],
};
