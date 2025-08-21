#!/bin/bash

# Self-Evolving Workflow Automator - Startup Script
# This script starts the complete application stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_ENV=${NODE_ENV:-development}
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
DATABASE_PATH=${DATABASE_PATH:-./backend/data/database.sqlite}
LOG_LEVEL=${LOG_LEVEL:-info}

echo -e "${BLUE}🚀 Starting Self-Evolving Workflow Automator${NC}"
echo -e "${BLUE}Environment: ${NODE_ENV}${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for ${service_name} to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ ${service_name} is ready${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}   Attempt ${attempt}/${max_attempts} - ${service_name} not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ ${service_name} failed to start within timeout${NC}"
    return 1
}

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}   Stopping backend (PID: $BACKEND_PID)${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}   Stopping frontend (PID: $FRONTEND_PID)${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Shutdown complete${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm ${NPM_VERSION}${NC}"

# Check if ports are available
if check_port $BACKEND_PORT; then
    echo -e "${RED}❌ Port ${BACKEND_PORT} is already in use${NC}"
    echo -e "${YELLOW}   Please stop the service using port ${BACKEND_PORT} or set BACKEND_PORT to a different value${NC}"
    exit 1
fi

if check_port $FRONTEND_PORT; then
    echo -e "${RED}❌ Port ${FRONTEND_PORT} is already in use${NC}"
    echo -e "${YELLOW}   Please stop the service using port ${FRONTEND_PORT} or set FRONTEND_PORT to a different value${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ports ${BACKEND_PORT} and ${FRONTEND_PORT} are available${NC}"

# Install dependencies if needed
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   Installing root dependencies...${NC}"
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}   Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}   Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Initialize database
echo -e "\n${BLUE}🗄️  Initializing database...${NC}"

# Create data directory if it doesn't exist
mkdir -p "$(dirname "$DATABASE_PATH")"

# Run database initialization
cd backend
npm run db:init
cd ..

echo -e "${GREEN}✅ Database initialized${NC}"

# Build applications
echo -e "\n${BLUE}🔨 Building applications...${NC}"

# Build backend
echo -e "${YELLOW}   Building backend...${NC}"
cd backend
npm run build
cd ..

# Build frontend for production
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${YELLOW}   Building frontend for production...${NC}"
    cd frontend
    npm run build
    cd ..
fi

echo -e "${GREEN}✅ Applications built${NC}"

# Start services
echo -e "\n${BLUE}🚀 Starting services...${NC}"

# Start backend
echo -e "${YELLOW}   Starting backend on port ${BACKEND_PORT}...${NC}"
cd backend
PORT=$BACKEND_PORT NODE_ENV=$NODE_ENV LOG_LEVEL=$LOG_LEVEL npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
if ! wait_for_service "http://localhost:$BACKEND_PORT/api/health" "Backend"; then
    cleanup
    exit 1
fi

# Start frontend
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${YELLOW}   Starting frontend in production mode...${NC}"
    # In production, you might serve the built frontend through the backend
    # or use a separate web server like nginx
    echo -e "${GREEN}✅ Frontend built and ready to be served${NC}"
else
    echo -e "${YELLOW}   Starting frontend development server on port ${FRONTEND_PORT}...${NC}"
    cd frontend
    PORT=$FRONTEND_PORT npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to be ready
    if ! wait_for_service "http://localhost:$FRONTEND_PORT" "Frontend"; then
        cleanup
        exit 1
    fi
fi

# Display startup information
echo -e "\n${GREEN}🎉 Self-Evolving Workflow Automator is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Backend:${NC}  http://localhost:$BACKEND_PORT"
echo -e "${BLUE}API:${NC}      http://localhost:$BACKEND_PORT/api"
echo -e "${BLUE}Health:${NC}   http://localhost:$BACKEND_PORT/api/health"

if [ "$NODE_ENV" != "production" ]; then
    echo -e "${BLUE}Frontend:${NC} http://localhost:$FRONTEND_PORT"
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep the script running and wait for signals
wait