#!/bin/bash

# Make all scripts executable
# Run this after cloning the repository

echo "Making scripts executable..."

chmod +x scripts/build.sh
chmod +x scripts/deploy.sh
chmod +x scripts/dev-setup.sh
chmod +x scripts/health-check.sh
chmod +x scripts/env-check.sh
chmod +x scripts/make-executable.sh

# Make Git hooks executable if they exist
if [ -f ".husky/pre-commit" ]; then
    chmod +x .husky/pre-commit
fi

if [ -f ".husky/pre-push" ]; then
    chmod +x .husky/pre-push
fi

# Make Docker entrypoint executable
if [ -f "docker/docker-entrypoint.sh" ]; then
    chmod +x docker/docker-entrypoint.sh
fi

echo "✅ All scripts are now executable"
echo ""
echo "Available scripts:"
echo "  ./scripts/dev-setup.sh     - Set up development environment"
echo "  ./scripts/build.sh         - Build the application"
echo "  ./scripts/deploy.sh        - Deploy to staging/production"
echo "  ./scripts/health-check.sh  - Check application health"
echo "  ./scripts/env-check.sh     - Validate environment configuration" 