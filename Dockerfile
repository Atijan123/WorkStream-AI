# Multi-stage build for Self-Evolving Workflow Automator

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Build backend
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    sqlite \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy built backend
COPY --from=backend-builder --chown=appuser:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=appuser:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=appuser:nodejs /app/backend/package*.json ./backend/

# Copy built frontend
COPY --from=frontend-builder --chown=appuser:nodejs /app/frontend/dist ./frontend/dist

# Copy scripts
COPY --chown=appuser:nodejs scripts/ ./scripts/

# Create necessary directories
RUN mkdir -p /app/data /app/logs && \
    chown -R appuser:nodejs /app/data /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/database.sqlite
ENV LOG_DIRECTORY=/app/logs
ENV LOG_LEVEL=info

# Expose port
EXPOSE 3001

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "backend/dist/index.js"]