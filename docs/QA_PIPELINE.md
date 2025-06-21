# Quality Assurance Pipeline Documentation

## Overview

The Solarium Web Portal uses a comprehensive QA pipeline that includes linting, type checking, testing, coverage validation, security scanning, and SonarQube analysis.

## Pipeline Components

### 1. Code Quality Checks

- **ESLint**: JavaScript/TypeScript linting with security rules
- **TypeScript**: Type checking and compilation validation  
- **Prettier**: Code formatting validation

### 2. Security Checks

- **npm audit**: Dependency vulnerability scanning
- **ESLint Security Plugin**: Code security pattern detection
- **OWASP ZAP**: Dynamic application security testing

### 3. Testing & Coverage

- **Vitest**: Unit and integration testing
- **Coverage Validation**: SonarQube-compliant thresholds
- **Accessibility Testing**: WCAG 2.1 AA compliance with jest-axe

### 4. Static Analysis

- **SonarQube**: Code quality, security, and maintainability analysis

## Coverage Thresholds

### Overall Requirements
- **Statements**: 80% minimum
- **Branches**: 75% minimum  
- **Functions**: 80% minimum
- **Lines**: 80% minimum

### Layer-Specific Requirements
- **Business Logic**: 85% minimum (utils, hooks, contexts, store slices)
- **API Layer**: 80% minimum (api, services)
- **UI Components**: 70% minimum (pages, components, layouts)

## Running QA Checks

### Local Development

```bash
# Run all QA checks
npm run qa-check

# Individual checks
npm run lint
npm run type-check
npm run test:coverage
npm run security:audit
npm run coverage:validate

# Security scan (requires Docker)
npm run security:scan
```

### CI/CD Pipeline

The pipeline runs automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

## Configuration Files

- `vitest.config.ts`: Test and coverage configuration
- `sonar-project.properties`: SonarQube project settings
- `.eslintrc.cjs`: Linting rules including security
- `scripts/coverage-threshold.js`: Coverage validation logic 
- `scripts/xss-scan.sh`: OWASP ZAP security scanning
- `scripts/qa-check.js`: Comprehensive QA automation

## Security Scanning

### OWASP ZAP Baseline Scan

The pipeline includes automated security scanning using OWASP ZAP:

- **Scope**: Full application baseline scan
- **Threshold**: Zero high/medium risk vulnerabilities
- **Reports**: HTML, JSON, and XML formats
- **CI Integration**: Fails build on critical findings

### Security Rules

ESLint security plugin enforces:
- No `eval()` or `Function()` constructor usage
- No `dangerouslySetInnerHTML` without review
- No unsafe regular expressions
- No object injection vulnerabilities
- No non-literal filesystem operations

## SonarQube Integration

### Quality Gates

- **Coverage**: 80% overall, 85% business logic
- **Duplicated Lines**: < 3%
- **Maintainability Rating**: A
- **Reliability Rating**: A
- **Security Rating**: A

### Reports

SonarQube analyzes:
- Code coverage from Vitest
- Test execution results
- Security hotspots
- Code smells and bugs
- Technical debt

## Troubleshooting

### Coverage Failures

If coverage fails:
1. Run `npm run test:coverage` to see detailed report
2. Add tests for uncovered lines/branches
3. Focus on business logic and error paths
4. Use `// istanbul ignore` sparingly for unreachable code

### Security Scan Failures

If ZAP scan fails:
1. Review HTML report in `security-reports/`
2. Address high/medium risk findings
3. Update CSP headers if needed
4. Test fixes locally with `npm run security:scan`

### SonarQube Issues

For SonarQube problems:
1. Check token and URL configuration
2. Verify coverage reports are generated
3. Review quality gate settings
4. Check project key matches configuration

## Best Practices

### Writing Testable Code

- Keep functions pure when possible
- Separate business logic from UI components
- Use dependency injection for external services
- Test error paths and edge cases

### Security

- Never disable security rules without review
- Use CSP headers to prevent XSS
- Validate all user inputs
- Keep dependencies updated

### Coverage

- Aim for 100% coverage on critical business logic
- Test both success and error scenarios  
- Include integration tests for complex flows
- Don't game coverage metrics - focus on quality

## Monitoring

The QA pipeline provides:
- Real-time coverage reports
- Security vulnerability alerts
- Code quality trend analysis
- Performance regression detection

For questions or issues, contact the development team. 