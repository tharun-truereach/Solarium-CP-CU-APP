# Scripts Directory

This directory contains build, deployment, and utility scripts for the Solarium Web Portal.

## Available Scripts

### `build.sh`
**Purpose**: Build the application for different environments with validation and optimization.

**Usage**:
```bash
./scripts/build.sh [OPTIONS]

Options:
  -e, --env ENV        Environment (development|staging|production)
  -c, --clean          Clean build directory first
  -a, --analyze        Analyze bundle size after build
  -v, --verbose        Verbose output
  -h, --help          Show help
```

**Examples**:
```bash
./scripts/build.sh --env production --clean --analyze
./scripts/build.sh --env staging --verbose
```

### `deploy.sh`
**Purpose**: Deploy the application to staging or production environments.

**Usage**:
```bash
./scripts/deploy.sh [OPTIONS]

Options:
  -e, --env ENV        Environment (staging|production)
  -d, --dry-run        Show what would be deployed
  -s, --skip-build     Skip build step
  -n, --no-backup      Skip backup creation
  -h, --help          Show help
```

**Examples**:
```bash
./scripts/deploy.sh --env staging
./scripts/deploy.sh --env production --no-backup
./scripts/deploy.sh --env staging --dry-run
```

### `dev-setup.sh`
**Purpose**: Set up the development environment from scratch.

**Usage**:
```bash
./scripts/dev-setup.sh
```

**What it does**:
- Checks Node.js and npm versions
- Installs dependencies
- Creates `.env.local` from `.env.example`
- Sets up Git hooks
- Creates necessary directories
- Runs initial validation
- Optionally starts development server

### `health-check.sh`
**Purpose**: Check application health and availability.

**Usage**:
```bash
./scripts/health-check.sh [OPTIONS]

Options:
  -u, --url URL        URL to check (default: http://localhost:3000)
  -t, --timeout SEC    Timeout in seconds (default: 10)
  -r, --retries NUM    Number of retries (default: 3)
  -v, --verbose        Verbose output
  -h, --help          Show help
```

**Examples**:
```bash
./scripts/health-check.sh --url https://app.solarium.com
./scripts/health-check.sh --verbose --timeout 30
```

### `env-check.sh`
**Purpose**: Validate environment configuration and variables.

**Usage**:
```bash
./scripts/env-check.sh [ENVIRONMENT]

Arguments:
  ENVIRONMENT         Environment to check (development|staging|production)
```

**Examples**:
```bash
./scripts/env-check.sh production
./scripts/env-check.sh staging
./scripts/env-check.sh  # Uses current environment
```

### `make-executable.sh`
**Purpose**: Make all scripts executable after cloning the repository.

**Usage**:
```bash
./scripts/make-executable.sh
```

## Script Setup

After cloning the repository, run:
```bash
chmod +x scripts/make-executable.sh
./scripts/make-executable.sh
```

This will make all scripts executable and display available commands.

## Integration with CI/CD

These scripts are designed to work with:
- **GitHub Actions**: Automated builds and deployments
- **Local Development**: Manual execution for testing
- **Docker**: Container builds and health checks
- **Monitoring**: Health check integration

## Environment Variables

Scripts respect and validate these environment variables:
- `REACT_APP_ENVIRONMENT` - Current environment
- `REACT_APP_API_BASE_URL` - API endpoint
- `REACT_APP_SESSION_TIMEOUT_MIN` - Session timeout
- `GENERATE_SOURCEMAP` - Source map generation
- And others defined in `.env` files

## Error Handling

All scripts include:
- **Color-coded output** for better readability
- **Proper exit codes** for CI/CD integration
- **Error validation** and helpful messages
- **Rollback capabilities** where applicable

## Security Considerations

- Scripts validate inputs and environment variables
- Production deployments require confirmation
- Sensitive operations include backup creation
- All scripts log actions for audit trails 