# Multi-stage build for the where-am-i application
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/web/package.json ./packages/web/
COPY packages/api/package.json ./packages/api/
COPY infra/package.json ./infra/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage for web
FROM base AS web-builder
COPY packages/web/ ./packages/web/
RUN pnpm --filter @where-am-i/web build

# Build stage for API
FROM base AS api-builder
COPY packages/api/ ./packages/api/
RUN pnpm --filter @where-am-i/api build

# Production stage
FROM node:20-slim AS production

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init wget && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -g 1001 nodejs
RUN useradd -u 1001 -g nodejs -s /bin/bash nextjs

# Set working directory
WORKDIR /app

# Copy built applications
COPY --from=web-builder --chown=nextjs:nodejs /app/packages/web/dist ./packages/web/dist
COPY --from=api-builder --chown=nextjs:nodejs /app/packages/api/dist ./packages/api/dist

# Copy package files and install only production dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/web/package.json ./packages/web/
COPY packages/api/package.json ./packages/api/

# Install only production dependencies and serve package
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod && npm install -g serve

# Copy source files needed for runtime
COPY packages/api/src/ ./packages/api/src/

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 5173 8787

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]
