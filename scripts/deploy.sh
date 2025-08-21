#!/bin/bash

# Self-Evolving Workflow Automator - Deployment Script
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
VERSION=${2:-latest}
REGISTRY=${DOCKER_REGISTRY:-}
IMAGE_NAME=${IMAGE_NAME:-workflow-automator}

echo -e "${BLUE}🚀 Deploying Self-Evolving Workflow Automator${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be healthy
wait_for_health() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for service to be healthy...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" | grep -q "healthy\|ok"; then
            echo -e "${GREEN}✅ Service is healthy${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}   Attempt ${attempt}/${max_attempts} - Service not healthy yet...${NC}"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Service failed to become healthy within timeout${NC}"
    return 1
}

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        echo -e "${GREEN}✅ Valid environment: ${ENVIRONMENT}${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: ${ENVIRONMENT}${NC}"
        echo -e "${YELLOW}   Valid environments: development, staging, production${NC}"
        exit 1
        ;;
esac

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites satisfied${NC}"

# Set environment-specific configuration
case $ENVIRONMENT in
    development)
        COMPOSE_FILE="docker-compose.yml"
        PORT=3001
        ;;
    staging)
        COMPOSE_FILE="docker-compose.yml:docker-compose.staging.yml"
        PORT=3002
        ;;
    production)
        COMPOSE_FILE="docker-compose.yml:docker-compose.prod.yml"
        PORT=3001
        ;;
esac

# Build or pull image
if [ -n "$REGISTRY" ]; then
    echo -e "${BLUE}📥 Pulling image from registry...${NC}"
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
    docker pull "$FULL_IMAGE_NAME"
    
    # Tag for local use
    docker tag "$FULL_IMAGE_NAME" "${IMAGE_NAME}:${VERSION}"
else
    echo -e "${BLUE}🔨 Building image locally...${NC}"
    docker build -t "${IMAGE_NAME}:${VERSION}" .
fi

echo -e "${GREEN}✅ Image ready${NC}"

# Create environment file
echo -e "${BLUE}⚙️  Creating environment configuration...${NC}"

cat > .env.${ENVIRONMENT} << EOF
NODE_ENV=${ENVIRONMENT}
PORT=${PORT}
LOG_LEVEL=${LOG_LEVEL:-info}
DATABASE_PATH=/app/data/database.sqlite
LOG_DIRECTORY=/app/logs
ENABLE_EMAIL_ALERTS=${ENABLE_EMAIL_ALERTS:-false}
ALERT_EMAIL_RECIPIENTS=${ALERT_EMAIL_RECIPIENTS:-}
IMAGE_TAG=${VERSION}
EOF

echo -e "${GREEN}✅ Environment configuration created${NC}"

# Stop existing services
echo -e "${BLUE}🛑 Stopping existing services...${NC}"
docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} down || true

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} up -d

# Wait for services to be healthy
echo -e "${BLUE}🏥 Checking service health...${NC}"
if ! wait_for_health "http://localhost:${PORT}/api/health"; then
    echo -e "${RED}❌ Deployment failed - service is not healthy${NC}"
    echo -e "${YELLOW}📋 Showing service logs:${NC}"
    docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} logs --tail=50
    exit 1
fi

# Run post-deployment tasks
echo -e "${BLUE}📋 Running post-deployment tasks...${NC}"

# Initialize database if needed
docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} exec -T app node backend/dist/scripts/initializeDatabase.js

# Run any pending migrations
docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} exec -T app node backend/dist/scripts/migrate.js up

echo -e "${GREEN}✅ Post-deployment tasks completed${NC}"

# Display deployment information
echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Environment:${NC} ${ENVIRONMENT}"
echo -e "${BLUE}Version:${NC}     ${VERSION}"
echo -e "${BLUE}URL:${NC}         http://localhost:${PORT}"
echo -e "${BLUE}Health:${NC}      http://localhost:${PORT}/api/health"
echo -e "${BLUE}API:${NC}         http://localhost:${PORT}/api"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Show running containers
echo -e "\n${BLUE}📦 Running containers:${NC}"
docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} ps

# Show logs
echo -e "\n${BLUE}📋 Recent logs:${NC}"
docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} logs --tail=20

echo -e "\n${YELLOW}💡 Useful commands:${NC}"
echo -e "${YELLOW}   View logs:${NC}    docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} logs -f"
echo -e "${YELLOW}   Stop:${NC}         docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} down"
echo -e "${YELLOW}   Restart:${NC}      docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} restart"
echo -e "${YELLOW}   Shell:${NC}        docker-compose --env-file .env.${ENVIRONMENT} -f ${COMPOSE_FILE} exec app sh"