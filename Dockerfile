# ==============================================================================
# STSMS Backend - Production Docker Container Specification
# Multi-stage production build for Node.js Express backend with Supabase integration
# ==============================================================================

FROM node:20-alpine AS base

# Install security updates and dumb-init for proper signal handling
RUN apk update && apk add --no-cache dumb-init

WORKDIR /app

# Copy root package manifests
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy server application source code and JSON seed data
COPY server ./server

# Create non-privileged service user for runtime security
RUN addgroup -S stsms && adduser -S stsms -G stsms
RUN chown -R stsms:stsms /app

USER stsms

# Expose default HTTP port
EXPOSE 5001

ENV NODE_ENV=production \
    PORT=5001

# Health check to ensure zero-downtime rolling restarts
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/server.js"]

