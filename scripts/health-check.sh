#!/bin/bash

# Health Check Script for Production Monitoring
# Usage: ./scripts/health-check.sh [BASE_URL]

BASE_URL=${1:-http://localhost:3000}
HEALTH_ENDPOINT="$BASE_URL/health"
API_ENDPOINT="$BASE_URL/api/v1"

echo "🏥 Running Health Check"
echo "======================="
echo "Base URL: $BASE_URL"
echo ""

# Function to check HTTP status
check_endpoint() {
    local url=$1
    local name=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "✅ $name: OK (Status: $response)"
        return 0
    else
        echo "❌ $name: FAILED (Status: $response)"
        return 1
    fi
}

# Check main health endpoint
check_endpoint "$HEALTH_ENDPOINT" "Health Check"
HEALTH_STATUS=$?

# Check API endpoint
check_endpoint "$API_ENDPOINT" "API Endpoint"
API_STATUS=$?

echo ""

# Overall status
if [ $HEALTH_STATUS -eq 0 ] && [ $API_STATUS -eq 0 ]; then
    echo "✅ All checks passed"
    exit 0
else
    echo "❌ Some checks failed"
    exit 1
fi
