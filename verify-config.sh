#!/bin/bash

# Configuration Verification Script
# This script helps verify your Railway deployment configuration

BACKEND_URL="${1:-https://resource-a-tron-backend-production.up.railway.app}"
FRONTEND_URL="${2:-}"

echo "========================================="
echo "Railway Configuration Verification"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health Check
echo "Test 1: Backend Health Check"
echo "------------------------------"
HEALTH_URL="${BACKEND_URL}/api/health"
echo "Checking: $HEALTH_URL"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Backend is accessible (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Backend is not accessible (HTTP $HTTP_CODE)${NC}"
    if [ -n "$BODY" ]; then
        echo "Error: $BODY"
    fi
fi
echo ""

# Test 2: Backend API Endpoints
echo "Test 2: Backend API Endpoints"
echo "------------------------------"

ENDPOINTS=("/api" "/api/users" "/api/projects" "/api/tasks")

for endpoint in "${ENDPOINTS[@]}"; do
    FULL_URL="${BACKEND_URL}${endpoint}"
    echo -n "Testing $endpoint ... "
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FULL_URL" 2>/dev/null)
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "404" ]; then
        # 401 is OK (auth required), 404 means endpoint exists but route not found (which is fine)
        echo -e "${GREEN}✓${NC} (HTTP $RESPONSE)"
    elif [ "$RESPONSE" = "000" ]; then
        echo -e "${RED}✗ Connection failed${NC}"
    else
        echo -e "${YELLOW}?${NC} (HTTP $RESPONSE)"
    fi
done
echo ""

# Test 3: CORS Check
echo "Test 3: CORS Configuration"
echo "------------------------------"
if [ -n "$FRONTEND_URL" ]; then
    echo "Testing CORS from: $FRONTEND_URL"
    CORS_HEADERS=$(curl -s -I -X OPTIONS \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: GET" \
        "$HEALTH_URL" 2>/dev/null)
    
    if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
        echo -e "${GREEN}✓ CORS headers present${NC}"
        echo "$CORS_HEADERS" | grep -i "access-control"
    else
        echo -e "${YELLOW}⚠ CORS headers not found (may need to configure CORS_ORIGIN)${NC}"
    fi
else
    echo "Skipping CORS test (no frontend URL provided)"
    echo "Usage: $0 <backend-url> <frontend-url>"
fi
echo ""

# Test 4: Database Connection (via API)
echo "Test 4: Database Connection"
echo "------------------------------"
USERS_URL="${BACKEND_URL}/api/users"
USERS_RESPONSE=$(curl -s -w "\n%{http_code}" "$USERS_URL" 2>/dev/null)
USERS_HTTP_CODE=$(echo "$USERS_RESPONSE" | tail -n1)
USERS_BODY=$(echo "$USERS_RESPONSE" | sed '$d')

if [ "$USERS_HTTP_CODE" = "200" ]; then
    USER_COUNT=$(echo "$USERS_BODY" | grep -o '"id"' | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ Database is accessible${NC}"
    echo "Found $USER_COUNT users in database"
elif [ "$USERS_HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠ Database accessible, but authentication required (this is normal)${NC}"
else
    echo -e "${RED}✗ Cannot access database (HTTP $USERS_HTTP_CODE)${NC}"
fi
echo ""

# Summary
echo "========================================="
echo "Summary"
echo "========================================="
echo "Backend URL: $BACKEND_URL"
if [ -n "$FRONTEND_URL" ]; then
    echo "Frontend URL: $FRONTEND_URL"
fi
echo ""
echo "Next Steps:"
echo "1. Ensure VITE_API_URL is set in Railway frontend service:"
echo "   VITE_API_URL=${BACKEND_URL}/api"
echo ""
echo "2. Ensure CORS_ORIGIN is set in Railway backend service:"
if [ -n "$FRONTEND_URL" ]; then
    echo "   CORS_ORIGIN=$FRONTEND_URL"
else
    echo "   CORS_ORIGIN=<your-frontend-railway-url>"
fi
echo ""
echo "3. Seed the database (if not done):"
echo "   cd backend"
echo "   railway run npm run seed"
echo "   railway run npm run seed:sample"

