#!/bin/bash

# Environment configuration check script for Solarium Web Portal
# Validates environment variables and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Environment to check (default: current environment)
ENVIRONMENT=${1:-$(echo $REACT_APP_ENVIRONMENT)}

if [ -z "$ENVIRONMENT" ]; then
    ENVIRONMENT="DEVELOPMENT"
fi

print_status "Checking environment configuration for: $ENVIRONMENT"

# Required environment variables
REQUIRED_VARS=(
    "REACT_APP_ENVIRONMENT"
    "REACT_APP_API_BASE_URL"
    "REACT_APP_SESSION_TIMEOUT_MIN"
    "REACT_APP_APP_NAME"
    "REACT_APP_APP_VERSION"
)

# Optional environment variables
OPTIONAL_VARS=(
    "REACT_APP_ENABLE_ANALYTICS"
    "REACT_APP_ENABLE_DEBUG_MODE"
    "GENERATE_SOURCEMAP"
)

# Check if environment file exists
ENV_FILE=".env.${ENVIRONMENT,,}"  # Convert to lowercase

if [ -f "$ENV_FILE" ]; then
    print_success "Environment file found: $ENV_FILE"
    source "$ENV_FILE"
else
    print_warning "Environment file not found: $ENV_FILE"
fi

# Check required variables
print_status "Checking required environment variables..."
error_count=0

for var in "${REQUIRED_VARS[@]}"; do
    value=${!var}
    if [ -z "$value" ]; then
        print_error "$var is not set"
        error_count=$((error_count + 1))
    else
        print_success "$var = $value"
    fi
done

# Check optional variables
print_status "Checking optional environment variables..."
for var in "${OPTIONAL_VARS[@]}"; do
    value=${!var}
    if [ -z "$value" ]; then
        print_warning "$var is not set (using default)"
    else
        print_status "$var = $value"
    fi
done

# Validate specific configurations
print_status "Validating configuration values..."

# Validate environment
if [[ ! "$REACT_APP_ENVIRONMENT" =~ ^(DEVELOPMENT|STAGING|PRODUCTION)$ ]]; then
    print_error "REACT_APP_ENVIRONMENT must be one of: DEVELOPMENT, STAGING, PRODUCTION"
    error_count=$((error_count + 1))
fi

# Validate API URL
if [ -n "$REACT_APP_API_BASE_URL" ]; then
    if [[ "$REACT_APP_API_BASE_URL" =~ ^https?:// ]]; then
        print_success "API URL format is valid"
        
        # Test connectivity (optional)
        if command -v curl >/dev/null 2>&1; then
            print_status "Testing API connectivity..."
            if curl -f -s --max-time 10 "${REACT_APP_API_BASE_URL}/health" >/dev/null 2>&1; then
                print_success "API is reachable"
            else
                print_warning "API is not reachable (this may be expected in some environments)"
            fi
        fi
    else
        print_error "REACT_APP_API_BASE_URL must be a valid HTTP/HTTPS URL"
        error_count=$((error_count + 1))
    fi
fi

# Validate session timeout
if [ -n "$REACT_APP_SESSION_TIMEOUT_MIN" ]; then
    if [[ "$REACT_APP_SESSION_TIMEOUT_MIN" =~ ^[0-9]+$ ]] && [ "$REACT_APP_SESSION_TIMEOUT_MIN" -gt 0 ]; then
        print_success "Session timeout is valid: ${REACT_APP_SESSION_TIMEOUT_MIN} minutes"
        
        # Warn about security implications
        if [ "$REACT_APP_SESSION_TIMEOUT_MIN" -gt 120 ]; then  # 2 hours
            print_warning "Session timeout is longer than 2 hours - consider security implications"
        fi
    else
        print_error "REACT_APP_SESSION_TIMEOUT_MIN must be a positive integer"
        error_count=$((error_count + 1))
    fi
fi

# Environment-specific validations
case $REACT_APP_ENVIRONMENT in
    "PRODUCTION")
        print_status "Running production environment checks..."
        
        # Check debug mode is disabled
        if [ "$REACT_APP_ENABLE_DEBUG_MODE" = "true" ]; then
            print_warning "Debug mode is enabled in production"
        fi
        
        # Check sourcemap generation
        if [ "$GENERATE_SOURCEMAP" = "true" ]; then
            print_warning "Source maps are enabled in production"
        fi
        
        # Check HTTPS
        if [[ "$REACT_APP_API_BASE_URL" == http://* ]]; then
            print_error "Production should use HTTPS for API URL"
            error_count=$((error_count + 1))
        fi
        ;;
        
    "STAGING")
        print_status "Running staging environment checks..."
        
        # Check analytics
        if [ "$REACT_APP_ENABLE_ANALYTICS" != "true" ]; then
            print_warning "Analytics should be enabled in staging for testing"
        fi
        ;;
        
    "DEVELOPMENT")
        print_status "Running development environment checks..."
        
        # Check debug mode is enabled
        if [ "$REACT_APP_ENABLE_DEBUG_MODE" != "true" ]; then
            print_warning "Debug mode should be enabled in development"
        fi
        ;;
esac

# Check Node.js and npm versions
print_status "Checking runtime versions..."

if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
    
    # Check minimum version
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_warning "Node.js version $NODE_VERSION is below recommended version 18"
    fi
else
    print_error "Node.js is not installed"
    error_count=$((error_count + 1))
fi

if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_success "npm version: $NPM_VERSION"
else
    print_error "npm is not installed"
    error_count=$((error_count + 1))
fi

# Summary
echo ""
if [ $error_count -eq 0 ]; then
    print_success "Environment configuration check passed!"
    print_status "Configuration Summary:"
    echo "  Environment: $REACT_APP_ENVIRONMENT"
    echo "  API URL: $REACT_APP_API_BASE_URL"
    echo "  Session Timeout: ${REACT_APP_SESSION_TIMEOUT_MIN} minutes"
    echo "  App Version: $REACT_APP_APP_VERSION"
    exit 0
else
    print_error "Environment configuration check failed with $error_count errors"
    print_error "Please fix the above issues before proceeding"
    exit 1
fi 