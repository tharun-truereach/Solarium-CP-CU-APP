#!/bin/bash

# Development setup script for Solarium Web Portal
# Sets up local development environment

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

print_status "Setting up Solarium Web Portal development environment..."

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
REQUIRED_NODE_VERSION="18"

if [[ $NODE_VERSION == "not installed" ]]; then
    print_error "Node.js is not installed. Please install Node.js $REQUIRED_NODE_VERSION or later."
    exit 1
fi

NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js $REQUIRED_NODE_VERSION or later."
    exit 1
fi

print_success "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version 2>/dev/null || echo "not installed")
if [[ $NPM_VERSION == "not installed" ]]; then
    print_error "npm is not installed."
    exit 1
fi

print_success "npm version: $NPM_VERSION"

# Install dependencies
print_status "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Setup environment file
if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local file..."
    cp .env.example .env.local
    print_success "Created .env.local from .env.example"
    print_warning "Please review and update .env.local with your local configuration"
else
    print_status ".env.local already exists"
fi

# Setup Git hooks
if [ -d ".git" ]; then
    print_status "Setting up Git hooks..."
    npm run prepare
    print_success "Git hooks configured"
fi

# Create necessary directories
print_status "Creating project directories..."
mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/charts
mkdir -p src/pages/auth
mkdir -p src/pages/dashboard
mkdir -p src/pages/leads
mkdir -p src/services/api
mkdir -p src/tests/mockData
mkdir -p public/assets

print_success "Project directories created"

# Run initial validation
print_status "Running initial validation..."

# Type checking
print_status "Checking TypeScript configuration..."
npm run typecheck
if [ $? -eq 0 ]; then
    print_success "TypeScript configuration is valid"
else
    print_warning "TypeScript configuration has issues"
fi

# Linting
print_status "Running linter..."
npm run lint
if [ $? -eq 0 ]; then
    print_success "Code linting passed"
else
    print_warning "Code linting found issues (run 'npm run lint:fix' to auto-fix)"
fi

# Run tests
print_status "Running tests..."
npm run test:ci
if [ $? -eq 0 ]; then
    print_success "All tests passed"
else
    print_warning "Some tests failed"
fi

# Final setup summary
echo ""
print_success "Development environment setup completed!"
echo ""
print_status "Quick Start:"
echo "  1. Review and update .env.local with your configuration"
echo "  2. Start development server: npm run dev"
echo "  3. Open browser to: http://localhost:3000"
echo ""
print_status "Available Scripts:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run test         - Run tests"
echo "  npm run lint         - Run linter"
echo "  npm run typecheck    - Check TypeScript"
echo ""
print_status "Documentation:"
echo "  README.md            - Project overview and setup"
echo "  src/components/      - Component documentation"
echo "  src/pages/           - Page structure documentation"
echo ""

# Check if development server should be started
read -p "Start development server now? (y/n): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting development server..."
    npm run dev
fi

exit 0 