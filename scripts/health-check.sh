#!/bin/bash

# Health check script for Solarium Web Portal
# Can be used by monitoring systems or deployment pipelines

set -e

# Default values
URL="http://localhost:3000"
TIMEOUT=10
RETRIES=3
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to show help
show_help() {
    echo "Solarium Web Portal Health Check Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL        URL to check (default: http://localhost:3000)"
    echo "  -t, --timeout SEC    Timeout in seconds (default: 10)"
    echo "  -r, --retries NUM    Number of retries (default: 3)"
    echo "  -v, --verbose        Verbose output"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --url https://app.solarium.com"
    echo "  $0 --url http://localhost:3000 --verbose"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -r|--retries)
            RETRIES="$2"
            shift 2
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

# Health check function
check_health() {
    local url=$1
    local attempt=$2
    
    print_status "Checking health for: $url (attempt $attempt/$RETRIES)"
    
    # Check main health endpoint
    local health_url="${url}/health"
    local main_url="${url}/"
    
    # Test health endpoint
    if curl -f -s --max-time "$TIMEOUT" "$health_url" > /dev/null 2>&1; then
        print_status "Health endpoint responsive"
        health_check_passed=true
    else
        print_status "Health endpoint not available, checking main page"
        health_check_passed=false
    fi
    
    # Test main page
    if curl -f -s --max-time "$TIMEOUT" "$main_url" > /dev/null 2>&1; then
        print_status "Main page responsive"
        main_page_passed=true
    else
        print_status "Main page not responsive"
        main_page_passed=false
    fi
    
    # Check if at least one endpoint is working
    if [ "$health_check_passed" = true ] || [ "$main_page_passed" = true ]; then
        return 0
    else
        return 1
    fi
}

# Detailed health check
detailed_health_check() {
    local url=$1
    
    print_status "Running detailed health check..."
    
    # Check response time
    local response_time
    response_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time "$TIMEOUT" "$url/" 2>/dev/null || echo "timeout")
    
    if [ "$response_time" != "timeout" ]; then
        local response_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "unknown")
        print_status "Response time: ${response_ms}ms"
        
        # Warn if response time is slow
        if (( $(echo "$response_time > 2.0" | bc -l 2>/dev/null || echo 0) )); then
            print_warning "Slow response time: ${response_ms}ms"
        fi
    else
        print_warning "Response time: timeout"
    fi
    
    # Check HTTP status
    local http_status
    http_status=$(curl -o /dev/null -s -w '%{http_code}' --max-time "$TIMEOUT" "$url/" 2>/dev/null || echo "000")
    
    case $http_status in
        200)
            print_status "HTTP Status: $http_status (OK)"
            ;;
        404)
            print_error "HTTP Status: $http_status (Not Found)"
            return 1
            ;;
        500|502|503|504)
            print_error "HTTP Status: $http_status (Server Error)"
            return 1
            ;;
        000)
            print_error "HTTP Status: Connection failed"
            return 1
            ;;
        *)
            print_warning "HTTP Status: $http_status"
            ;;
    esac
    
    # Check content type
    local content_type
    content_type=$(curl -o /dev/null -s -w '%{content_type}' --max-time "$TIMEOUT" "$url/" 2>/dev/null || echo "unknown")
    
    if [[ $content_type == *"text/html"* ]]; then
        print_status "Content-Type: $content_type (OK)"
    else
        print_warning "Content-Type: $content_type (Expected HTML)"
    fi
    
    return 0
}

# Main execution
print_status "Starting health check for Solarium Web Portal"
print_status "Target URL: $URL"
print_status "Timeout: ${TIMEOUT}s"
print_status "Max retries: $RETRIES"

# Attempt health check with retries
attempt=1
while [ $attempt -le $RETRIES ]; do
    if check_health "$URL" "$attempt"; then
        print_success "Health check passed on attempt $attempt"
        
        # Run detailed check if verbose
        if [ "$VERBOSE" = true ]; then
            detailed_health_check "$URL"
        fi
        
        print_success "Application is healthy!"
        exit 0
    else
        if [ $attempt -lt $RETRIES ]; then
            print_warning "Health check failed on attempt $attempt, retrying in 5 seconds..."
            sleep 5
        else
            print_error "Health check failed on attempt $attempt"
        fi
        
        attempt=$((attempt + 1))
    fi
done

print_error "Health check failed after $RETRIES attempts"
print_error "Application appears to be unhealthy or unreachable"

exit 1 