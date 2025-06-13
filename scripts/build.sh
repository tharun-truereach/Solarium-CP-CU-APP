#!/bin/bash

# Build script for Solarium Web Portal
# Supports different environments and build types

set -e

# Default values
ENVIRONMENT="production"
CLEAN=false
ANALYZE=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to show help
show_help() {
    echo "Solarium Web Portal Build Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV        Environment to build for (development|staging|production)"
    echo "  -c, --clean          Clean build directory before building"
    echo "  -a, --analyze        Analyze bundle size after building"
    echo "  -v, --verbose        Verbose output"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --env production --clean"
    echo "  $0 --env staging --analyze"
    echo "  $0 --env development --verbose"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -a|--analyze)
            ANALYZE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Must be one of: development, staging, production"
    exit 1
fi

print_status "Building Solarium Web Portal for $ENVIRONMENT environment"

# Clean build directory if requested
if [ "$CLEAN" = true ]; then
    print_status "Cleaning build directory..."
    npm run clean
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run type checking
print_status "Running type checking..."
if [ "$VERBOSE" = true ]; then
    npm run typecheck
else
    npm run typecheck > /dev/null 2>&1
fi

if [ $? -ne 0 ]; then
    print_error "Type checking failed"
    exit 1
fi

print_success "Type checking passed"

# Run linting
print_status "Running linting..."
if [ "$VERBOSE" = true ]; then
    npm run lint
else
    npm run lint > /dev/null 2>&1
fi

if [ $? -ne 0 ]; then
    print_error "Linting failed"
    exit 1
fi

print_success "Linting passed"

# Run tests
print_status "Running tests..."
if [ "$VERBOSE" = true ]; then
    npm run test:ci
else
    npm run test:ci > /dev/null 2>&1
fi

if [ $? -ne 0 ]; then
    print_error "Tests failed"
    exit 1
fi

print_success "Tests passed"

# Build the application
print_status "Building application for $ENVIRONMENT..."
BUILD_START_TIME=$(date +%s)

case $ENVIRONMENT in
    development)
        npm run build:development
        ;;
    staging)
        npm run build:staging
        ;;
    production)
        npm run build:production
        ;;
esac

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

BUILD_END_TIME=$(date +%s)
BUILD_DURATION=$((BUILD_END_TIME - BUILD_START_TIME))

print_success "Build completed in ${BUILD_DURATION} seconds"

# Show build output info
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    print_status "Build output size: $DIST_SIZE"
    
    # Count files
    JS_FILES=$(find dist -name "*.js" | wc -l)
    CSS_FILES=$(find dist -name "*.css" | wc -l)
    
    print_status "Generated files: $JS_FILES JavaScript, $CSS_FILES CSS"
fi

# Analyze bundle if requested
if [ "$ANALYZE" = true ]; then
    print_status "Analyzing bundle size..."
    npm run analyze
fi

# Show next steps
print_success "Build completed successfully!"
echo ""
print_status "Next steps:"
echo "  - Test the build: npm run preview:$ENVIRONMENT"
echo "  - Deploy the 'dist' directory to your hosting service"
echo "  - Ensure environment variables are configured on the server"

exit 0 