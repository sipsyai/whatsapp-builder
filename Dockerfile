# =====================================================
# WhatsApp Builder - Production Dockerfile
# Multi-stage build: Frontend + Backend
# =====================================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend (output: dist/)
RUN npm run build

# =====================================================
# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build backend (output: dist/)
RUN npm run build

# =====================================================
# Stage 3: Production
FROM node:20-alpine AS production

# Set environment
ENV NODE_ENV=production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy backend package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend to public folder (for ServeStaticModule)
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy TypeORM config and migrations for production
COPY backend/ormconfig.ts ./ormconfig.ts
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src/migrations ./src/migrations

# Set ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/src/main.js"]
