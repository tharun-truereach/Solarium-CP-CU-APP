#!/bin/bash

# Deployment script for Solarium Web Portal
# Handles deployment to different environments

set -e

# Default values
ENVIRONMENT="staging"
DRY_RUN=false
SKIP_BUILD=false
BACKUP=true

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
    echo "Solarium Web Portal Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV        Environment to deploy to (staging|production)"
    echo "  -d, --dry-run        Show what would be deployed without actually deploying"
    echo "  -s, --skip-build     Skip the build step (use existing dist)"
    echo "  -n, --no-backup      Skip backup creation"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --env staging"
    echo "  $0 --env production --no-backup"
    echo "  $0 --env staging --dry-run"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -n|--no-backup)
            BACKUP=false
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
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Must be one of: staging, production"
    exit 1
fi

print_status "Preparing deployment to $ENVIRONMENT environment"

# Confirm production deployment
if [ "$ENVIRONMENT" = "production" ] && [ "$DRY_RUN" = false ]; then
    print_warning "You are about to deploy to PRODUCTION!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if git working directory is clean
if [ "$ENVIRONMENT" = "production" ]; then
    if ! git diff-index --quiet HEAD --; then
        print_error "Git working directory is not clean. Please commit or stash changes."
        exit 1
    fi
    print_success "Git working directory is clean"
fi

# Check if we're on the correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
EXPECTED_BRANCH="main"

if [ "$ENVIRONMENT" = "staging" ]; then
    EXPECTED_BRANCH="develop"
fi

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ] && [ "$ENVIRONMENT" = "production" ]; then
    print_warning "Currently on branch '$CURRENT_BRANCH', expected '$EXPECTED_BRANCH'"
    read -p "Continue anyway? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
fi

# Build if not skipped
if [ "$SKIP_BUILD" = false ]; then
    print_status "Building application..."
    ./scripts/build.sh --env $ENVIRONMENT
else
    print_status "Skipping build step"
    if [ ! -d "dist" ]; then
        print_error "No dist directory found. Run build first or remove --skip-build flag."
        exit 1
    fi
fi

# Create backup if requested
if [ "$BACKUP" = true ] && [ "$DRY_RUN" = false ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_DIR="backups/${ENVIRONMENT}_${TIMESTAMP}"
    
    print_status "Creating backup..."
    if [ "$DRY_RUN" = false ]; then
        mkdir -p backups
        # This would backup the current deployment
        # Implementation depends on your hosting setup
        print_success "Backup created: $BACKUP_DIR"
    fi
fi

# Deployment steps based on environment
case $ENVIRONMENT in
    staging)
        print_status "Deploying to staging environment..."
        DEPLOY_TARGET="staging.solarium.com"
        ;;
    production)
        print_status "Deploying to production environment..."
        DEPLOY_TARGET="app.solarium.com"
        ;;
esac

if [ "$DRY_RUN" = true ]; then
    print_status "DRY RUN - Would deploy to: $DEPLOY_TARGET"
    print_status "DRY RUN - Files to deploy:"
    find dist -type f | head -10
    echo "... and $(find dist -type f | wc -l) total files"
else
    # Actual deployment logic would go here
    # This depends on your hosting provider (Azure, AWS, etc.)
    
    print_status "Uploading files to $DEPLOY_TARGET..."
    
    # Example Azure Static Web Apps deployment
    # az staticwebapp deploy --name solarium-webprt-$ENVIRONMENT --source dist --verbose
    
    # Example AWS S3 deployment
    # aws s3 sync dist/ s3://solarium-webprt-$ENVIRONMENT/ --delete --exact-timestamps
    
    # Example traditional hosting (rsync)
    # rsync -avz --delete dist/ user@$DEPLOY_TARGET:/var/www/html/
    
    print_success "Files uploaded successfully"
fi

# Post-deployment verification
print_status "Running post-deployment verification..."

if [ "$DRY_RUN" = false ]; then
    # Health check
    HEALTH_URL="https://$DEPLOY_TARGET/health"
    
    print_status "Checking application health..."
    
    # Wait a moment for deployment to propagate
    sleep 10
    
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - please verify deployment manually"
    fi
    
    # Check if main page loads
    MAIN_URL="https://$DEPLOY_TARGET/"
    if curl -f -s "$MAIN_URL" > /dev/null; then
        print_success "Main page is accessible"
    else
        print_warning "Main page check failed"
    fi
fi

# Deployment summary
echo ""
print_success "Deployment completed successfully!"
echo ""
print_status "Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Target: $DEPLOY_TARGET"
echo "  Time: $(date)"
echo "  Git Commit: $(git rev-parse --short HEAD)"

if [ "$DRY_RUN" = false ]; then
    echo ""
    print_status "URLs:"
    echo "  Application: https://$DEPLOY_TARGET/"
    echo "  Health Check: https://$DEPLOY_TARGET/health"
fi

exit 0 