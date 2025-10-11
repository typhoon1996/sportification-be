# =============================================================================
# MULTI-STAGE PRODUCTION-OPTIMIZED DOCKERFILE
# =============================================================================
# This Dockerfile creates a secure, optimized production image
# Features:
# - Multi-stage build to minimize image size
# - Security hardening with non-root user
# - Health checks for container orchestration
# - Optimized layer caching
# - Distroless option for production
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:18-alpine AS dependencies

# Install security updates and build dependencies
RUN apk update && apk upgrade && \
  apk add --no-cache \
  python3 \
  make \
  g++ \
  && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# -----------------------------------------------------------------------------
# Stage 3: Production (Default)
# -----------------------------------------------------------------------------
FROM node:18-alpine AS production

# Install security updates and dumb-init for proper signal handling
RUN apk update && apk upgrade && \
  apk add --no-cache dumb-init curl && \
  rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs && \
  adduser -S appuser -u 1001 -G nodejs

# Copy built application from builder stage
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./

# Create necessary directories with proper permissions
RUN mkdir -p logs uploads /tmp/app && \
  chown -R appuser:nodejs logs uploads /tmp/app

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 3000

# Add labels for metadata
LABEL maintainer="Sports Companion Team" \
  version="1.0.0" \
  description="Sportification Backend API" \
  org.opencontainers.image.source="https://github.com/typhoon1996/sportification-be"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]

# -----------------------------------------------------------------------------
# Stage 4: Development (For local development with hot-reload)
# -----------------------------------------------------------------------------
FROM node:18-alpine AS development

# Install development tools
RUN apk update && apk add --no-cache \
  bash \
  curl \
  git \
  && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S appuser -u 1001 -G nodejs && \
  chown -R appuser:nodejs /app

USER appuser

EXPOSE 3000

# Start with nodemon for hot-reload
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Stage 5: Test (For running tests in CI/CD)
# -----------------------------------------------------------------------------
FROM node:18-alpine AS test

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Run tests
CMD ["npm", "test"]

# -----------------------------------------------------------------------------
# Stage 6: Distroless (Ultra-minimal production image - Optional)
# -----------------------------------------------------------------------------
FROM gcr.io/distroless/nodejs18-debian11 AS distroless

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/package*.json ./

# Use non-root user
USER nonroot

EXPOSE 3000

# Start application (no shell available in distroless)
CMD ["dist/index.js"]