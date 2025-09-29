# Multi-stage Dockerfile for PolePlan Pro Enterprise
FROM node:22.12.0-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .nvmrc ./

# Install dependencies with exact versions
RUN npm ci --only=production --no-audit --no-fund

# Development stage
FROM base AS development
RUN npm ci --no-audit --no-fund
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
COPY . .
RUN npm ci --no-audit --no-fund
RUN npm run build

# Production stage
FROM base AS production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S poleplan -u 1001 -G nodejs

# Create directories and set permissions
RUN mkdir -p /app/logs /app/uploads && \
    chown -R poleplan:nodejs /app

USER poleplan

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]