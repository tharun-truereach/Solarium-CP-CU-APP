#!/bin/bash

# OWASP ZAP XSS Security Scan Script
# Performs automated baseline security scan against built application

set -e

# Configuration
ZAP_VERSION="2.14.0"
SCAN_TARGET="http://localhost:4173"  # Vite preview port
REPORT_DIR="./security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/zap-baseline-report-$TIMESTAMP.html"
JSON_REPORT="$REPORT_DIR/zap-baseline-report-$TIMESTAMP.json"
XML_REPORT="$REPORT_DIR/zap-baseline-report-$TIMESTAMP.xml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Starting OWASP ZAP Baseline Security Scan"
echo "============================================="

# Create reports directory
mkdir -p "$REPORT_DIR"

# Function to cleanup
cleanup() {
    echo -e "\n🧹 Cleaning up..."
    if [ ! -z "$BUILD_PID" ]; then
        kill $BUILD_PID 2>/dev/null || true
        wait $BUILD_PID 2>/dev/null || true
    fi
    
    # Stop any running containers
    docker stop zap-baseline 2>/dev/null || true
    docker rm zap-baseline 2>/dev/null || true
}

# Set trap for cleanup
trap cleanup EXIT

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or available${NC}"
    exit 1
fi

# Build the application
echo "📦 Building application for security scan..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Start preview server in background
echo "🚀 Starting preview server..."
npm run preview > /dev/null 2>&1 &
BUILD_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Verify server is running
if ! curl -s "$SCAN_TARGET" > /dev/null; then
    echo -e "${RED}❌ Preview server is not responding at $SCAN_TARGET${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Preview server is running${NC}"

# Pull ZAP Docker image
echo "📥 Pulling OWASP ZAP Docker image..."
docker pull owasp/zap2docker-stable:$ZAP_VERSION

# Run ZAP baseline scan
echo "🔍 Running OWASP ZAP baseline scan..."
echo "Target: $SCAN_TARGET"
echo "Report: $REPORT_FILE"

# ZAP scan command with comprehensive options
docker run --rm \
    --name zap-baseline \
    --network host \
    -v "$PWD/$REPORT_DIR:/zap/wrk/:rw" \
    owasp/zap2docker-stable:$ZAP_VERSION \
    zap-baseline.py \
    -t "$SCAN_TARGET" \
    -g gen.conf \
    -r "zap-baseline-report-$TIMESTAMP.html" \
    -J "zap-baseline-report-$TIMESTAMP.json" \
    -x "zap-baseline-report-$TIMESTAMP.xml" \
    -a \
    -j \
    -l WARN \
    -z "-configfile /zap/wrk/zap.conf"

# Check scan exit code
SCAN_EXIT_CODE=$?

echo -e "\n📊 Scan Results:"
echo "================"

# Process results
if [ $SCAN_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ ZAP Baseline Scan PASSED - No high/medium risk vulnerabilities found${NC}"
    
elif [ $SCAN_EXIT_CODE -eq 1 ]; then
    echo -e "${YELLOW}⚠️  ZAP Baseline Scan completed with WARNINGS${NC}"
    echo "Some low-risk issues may have been found"
    
elif [ $SCAN_EXIT_CODE -eq 2 ]; then
    echo -e "${RED}❌ ZAP Baseline Scan FAILED - High/Medium risk vulnerabilities found${NC}"
    echo "Security issues must be addressed before deployment"
    
else
    echo -e "${RED}❌ ZAP Baseline Scan encountered an error (exit code: $SCAN_EXIT_CODE)${NC}"
fi

# Display report locations
echo -e "\n📋 Reports generated:"
if [ -f "$REPORT_FILE" ]; then
    echo "  • HTML Report: $REPORT_FILE"
fi
if [ -f "$JSON_REPORT" ]; then
    echo "  • JSON Report: $JSON_REPORT"
fi
if [ -f "$XML_REPORT" ]; then
    echo "  • XML Report: $XML_REPORT"
fi

# Parse JSON report for summary if available
if [ -f "$JSON_REPORT" ]; then
    echo -e "\n📈 Vulnerability Summary:"
    
    # Extract vulnerability counts using jq if available
    if command -v jq &> /dev/null; then
        HIGH_COUNT=$(jq '.site[0].alerts[] | select(.riskdesc | contains("High"))' "$JSON_REPORT" 2>/dev/null | jq -s length 2>/dev/null || echo "0")
        MEDIUM_COUNT=$(jq '.site[0].alerts[] | select(.riskdesc | contains("Medium"))' "$JSON_REPORT" 2>/dev/null | jq -s length 2>/dev/null || echo "0")
        LOW_COUNT=$(jq '.site[0].alerts[] | select(.riskdesc | contains("Low"))' "$JSON_REPORT" 2>/dev/null | jq -s length 2>/dev/null || echo "0")
        INFO_COUNT=$(jq '.site[0].alerts[] | select(.riskdesc | contains("Informational"))' "$JSON_REPORT" 2>/dev/null | jq -s length 2>/dev/null || echo "0")
        
        echo "  • High Risk: $HIGH_COUNT"
        echo "  • Medium Risk: $MEDIUM_COUNT"
        echo "  • Low Risk: $LOW_COUNT"
        echo "  • Informational: $INFO_COUNT"
        
        if [ "$HIGH_COUNT" -gt 0 ] || [ "$MEDIUM_COUNT" -gt 0 ]; then
            echo -e "\n${RED}⚠️  Critical security issues found - deployment should be blocked${NC}"
        fi
    else
        echo "  (Install jq for detailed vulnerability breakdown)"
    fi
fi

# CI/CD integration notes
echo -e "\n🤖 CI/CD Integration:"
echo "  • Exit code $SCAN_EXIT_CODE indicates scan result"
echo "  • Use exit code 2 to fail CI pipeline for high/medium risks"
echo "  • Reports are available as build artifacts"

# Fail pipeline if high/medium risks found
if [ $SCAN_EXIT_CODE -eq 2 ]; then
    echo -e "\n${RED}❌ Security scan failed - exiting with error code 1${NC}"
    exit 1
fi

if [ $SCAN_EXIT_CODE -eq 1 ]; then
    echo -e "\n${YELLOW}⚠️  Security scan completed with warnings - review recommended${NC}"
fi

echo -e "\n${GREEN}🔒 Security scan completed successfully${NC}"
exit 0 