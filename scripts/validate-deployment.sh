#!/bin/bash

# Self-Evolving Workflow Automator - Deployment Validation Script
# This script validates that the deployment is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${1:-http://localhost:3001}
TIMEOUT=${2:-30}

echo -e "${BLUE}🔍 Validating Self-Evolving Workflow Automator Deployment${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
echo ""

# Function to make HTTP request and check response
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    
    echo -e "${YELLOW}   Testing ${endpoint}...${NC}"
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/response.json "${BASE_URL}${endpoint}" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}   ✅ ${description} - OK${NC}"
        return 0
    else
        echo -e "${RED}   ❌ ${description} - Failed (HTTP ${response})${NC}"
        if [ -f /tmp/response.json ]; then
            echo -e "${RED}      Response: $(cat /tmp/response.json)${NC}"
        fi
        return 1
    fi
}

# Function to check JSON response content
check_json_content() {
    local endpoint=$1
    local jq_filter=$2
    local expected_value=$3
    local description=$4
    
    echo -e "${YELLOW}   Testing ${endpoint} content...${NC}"
    
    local response=$(curl -s "${BASE_URL}${endpoint}" || echo "{}")
    local actual_value=$(echo "$response" | jq -r "$jq_filter" 2>/dev/null || echo "null")
    
    if [ "$actual_value" = "$expected_value" ]; then
        echo -e "${GREEN}   ✅ ${description} - OK${NC}"
        return 0
    else
        echo -e "${RED}   ❌ ${description} - Expected: ${expected_value}, Got: ${actual_value}${NC}"
        return 1
    fi
}

# Function to test WebSocket connection
test_websocket() {
    echo -e "${YELLOW}   Testing WebSocket connection...${NC}"
    
    # Use a simple Node.js script to test WebSocket
    local ws_test_result=$(node -e "
        const io = require('socket.io-client');
        const socket = io('${BASE_URL}', { timeout: 5000 });
        
        socket.on('connect', () => {
            console.log('connected');
            socket.disconnect();
            process.exit(0);
        });
        
        socket.on('connect_error', (error) => {
            console.log('error');
            process.exit(1);
        });
        
        setTimeout(() => {
            console.log('timeout');
            process.exit(1);
        }, 5000);
    " 2>/dev/null || echo "error")
    
    if [ "$ws_test_result" = "connected" ]; then
        echo -e "${GREEN}   ✅ WebSocket connection - OK${NC}"
        return 0
    else
        echo -e "${RED}   ❌ WebSocket connection - Failed${NC}"
        return 1
    fi
}

# Start validation
echo -e "${BLUE}🏥 Health Checks${NC}"

# Basic health check
if ! check_endpoint "/api/health" 200 "Health endpoint"; then
    echo -e "${RED}❌ Basic health check failed - deployment may not be ready${NC}"
    exit 1
fi

# Check if response contains expected health data
if command -v jq >/dev/null 2>&1; then
    check_json_content "/api/health" ".status" "healthy" "Health status" || \
    check_json_content "/api/health" ".status" "ok" "Health status (alternative)"
fi

echo -e "\n${BLUE}📡 API Endpoints${NC}"

# Test core API endpoints
check_endpoint "/api/dashboard/data" 200 "Dashboard data endpoint"
check_endpoint "/api/workflows" 200 "Workflows endpoint"
check_endpoint "/api/features/requests" 200 "Feature requests endpoint"
check_endpoint "/api/monitoring/health" 200 "Monitoring health endpoint"
check_endpoint "/api/monitoring/metrics" 200 "System metrics endpoint"
check_endpoint "/api/monitoring/alerts" 200 "Alerts endpoint"

echo -e "\n${BLUE}🔌 Real-time Features${NC}"

# Test WebSocket connection (if socket.io-client is available)
if command -v node >/dev/null 2>&1 && node -e "require('socket.io-client')" 2>/dev/null; then
    test_websocket
else
    echo -e "${YELLOW}   ⚠️  WebSocket test skipped (socket.io-client not available)${NC}"
fi

echo -e "\n${BLUE}🗄️  Database Operations${NC}"

# Test database operations by checking if we can retrieve data
echo -e "${YELLOW}   Testing database connectivity...${NC}"
if curl -s "${BASE_URL}/api/workflows" | grep -q "\[\]" || curl -s "${BASE_URL}/api/workflows" | grep -q "id"; then
    echo -e "${GREEN}   ✅ Database connectivity - OK${NC}"
else
    echo -e "${RED}   ❌ Database connectivity - Failed${NC}"
fi

echo -e "\n${BLUE}⚡ Performance Tests${NC}"

# Test response times
echo -e "${YELLOW}   Testing response times...${NC}"

for endpoint in "/api/health" "/api/dashboard/data" "/api/workflows"; do
    local start_time=$(date +%s%N)
    curl -s "${BASE_URL}${endpoint}" >/dev/null
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 1000 ]; then
        echo -e "${GREEN}   ✅ ${endpoint} - ${duration}ms${NC}"
    elif [ $duration -lt 2000 ]; then
        echo -e "${YELLOW}   ⚠️  ${endpoint} - ${duration}ms (slow)${NC}"
    else
        echo -e "${RED}   ❌ ${endpoint} - ${duration}ms (too slow)${NC}"
    fi
done

echo -e "\n${BLUE}🔒 Security Checks${NC}"

# Test security headers
echo -e "${YELLOW}   Checking security headers...${NC}"
local headers=$(curl -s -I "${BASE_URL}/api/health")

if echo "$headers" | grep -qi "x-frame-options"; then
    echo -e "${GREEN}   ✅ X-Frame-Options header present${NC}"
else
    echo -e "${YELLOW}   ⚠️  X-Frame-Options header missing${NC}"
fi

if echo "$headers" | grep -qi "x-content-type-options"; then
    echo -e "${GREEN}   ✅ X-Content-Type-Options header present${NC}"
else
    echo -e "${YELLOW}   ⚠️  X-Content-Type-Options header missing${NC}"
fi

echo -e "\n${BLUE}📊 System Status Summary${NC}"

# Get system status if available
if curl -s "${BASE_URL}/api/monitoring/health" >/dev/null 2>&1; then
    local system_status=$(curl -s "${BASE_URL}/api/monitoring/health" | jq -r '.status' 2>/dev/null || echo "unknown")
    case $system_status in
        "healthy")
            echo -e "${GREEN}   ✅ System Status: Healthy${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}   ⚠️  System Status: Warning${NC}"
            ;;
        "critical")
            echo -e "${RED}   ❌ System Status: Critical${NC}"
            ;;
        *)
            echo -e "${YELLOW}   ⚠️  System Status: Unknown${NC}"
            ;;
    esac
else
    echo -e "${YELLOW}   ⚠️  System status unavailable${NC}"
fi

echo -e "\n${GREEN}🎉 Validation Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Deployment URL:${NC} ${BASE_URL}"
echo -e "${BLUE}Dashboard:${NC}      ${BASE_URL%:*}:5173 (if running in development)"
echo -e "${BLUE}API Docs:${NC}       ${BASE_URL}/api"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Cleanup
rm -f /tmp/response.json

echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo -e "${YELLOW}   1. Access the dashboard in your browser${NC}"
echo -e "${YELLOW}   2. Try submitting a feature request${NC}"
echo -e "${YELLOW}   3. Create a workflow using natural language${NC}"
echo -e "${YELLOW}   4. Monitor system metrics and alerts${NC}"