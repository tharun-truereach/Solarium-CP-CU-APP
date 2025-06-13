#!/bin/sh

# Docker entrypoint script for Solarium Web Portal
# Handles environment variable substitution in nginx config

set -e

echo "🚀 Starting Solarium Web Portal..."
echo "Environment: ${REACT_APP_ENVIRONMENT}"
echo "API Base URL: ${REACT_APP_API_BASE_URL}"

# Substitute environment variables in nginx config
envsubst '${REACT_APP_API_BASE_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Validate nginx configuration
nginx -t

echo "✅ Configuration validated successfully"

# Execute the main command
exec "$@" 