# Production Deployment Guide

Complete guide for deploying WhatsApp Builder to production using Docker.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Environment Configuration](#environment-configuration)
- [Deployment Steps](#deployment-steps)
- [Health Checks](#health-checks)
- [Cloudflare Tunnel Setup](#cloudflare-tunnel-setup)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

---

## Overview

WhatsApp Builder uses a **single Docker container** that serves both frontend and backend, deployed alongside PostgreSQL database and optional Cloudflare Tunnel for secure HTTPS access.

**Production URL**: https://whatsapp.sipsy.ai

**Key Features**:
- Multi-stage Docker build (Frontend + Backend)
- Single container deployment (~200MB optimized image)
- PostgreSQL with persistent storage
- Health check endpoints
- Cloudflare Tunnel integration
- Non-root user security
- Automated migrations

---

## Prerequisites

- Docker 24.0+ and Docker Compose 2.0+
- PostgreSQL 15+ (or use Docker container)
- Domain name (optional, for Cloudflare Tunnel)
- WhatsApp Business API credentials
- 2GB+ RAM, 10GB+ storage

---

## Architecture

```
┌─────────────────────────────────────────┐
│      Cloudflare Tunnel (Optional)       │
│     https://whatsapp.sipsy.ai            │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│   Docker Container: whatsapp-backend    │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Frontend (Static Files)           │ │
│  │  Served by NestJS                  │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Backend (NestJS)                  │ │
│  │  Port 3000                         │ │
│  │  - REST API                        │ │
│  │  - WebSocket (Socket.IO)           │ │
│  │  - Health Checks                   │ │
│  └────────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Docker Container: whatsapp-db         │
│   PostgreSQL 15                         │
│   Port 5432                             │
└─────────────────────────────────────────┘
```

---

## Environment Configuration

### 1. Create Production Environment File

```bash
# Copy example file
cp .env.production.example .env

# Edit with production values
nano .env
```

### 2. Required Environment Variables

```bash
# ==========================================
# Database Configuration
# ==========================================
DB_USERNAME=postgres
DB_PASSWORD=your_secure_database_password_here
DB_NAME=whatsapp_builder

# ==========================================
# WhatsApp Business API
# ==========================================
# Get from Meta Developer Portal (https://developers.facebook.com/apps)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id
WABA_ID=your_whatsapp_business_account_id
WHATSAPP_APP_SECRET=your_app_secret
WEBHOOK_VERIFY_TOKEN=your_custom_verify_token
API_VERSION=v24.0
WHATSAPP_API_VERSION=v24.0

# ==========================================
# Application URLs
# ==========================================
FRONTEND_URL=https://whatsapp.sipsy.ai
FLOW_ENDPOINT_URL=https://whatsapp.sipsy.ai/api/flow-endpoint
WEBHOOK_URL=https://whatsapp.sipsy.ai/api/webhooks/whatsapp

# ==========================================
# Optional Configuration
# ==========================================
# Admin phone numbers (comma-separated)
ADMIN_PHONE_NUMBERS=905551234567,905559876543

# WhatsApp Flows encryption (if using encrypted flows)
WHATSAPP_FLOW_PRIVATE_KEY=your_private_key

# Cloudflare Tunnel Token (if using tunnel)
CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token
```

### 3. Security Best Practices

**Strong Passwords**:
```bash
# Generate secure password (Linux/Mac)
openssl rand -base64 32

# Example output:
DB_PASSWORD=xK8j3nP9qR2wF5tY7vL4mN6hB1cD0eS8
```

**Secrets Management**:
- Never commit `.env` to Git
- Use environment-specific files (`.env.production`, `.env.staging`)
- Rotate credentials regularly (quarterly recommended)
- Store backups in secure location (AWS Secrets Manager, 1Password, etc.)

---

## Deployment Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/whatsapp-builder.git
cd whatsapp-builder
```

### Step 2: Configure Environment

```bash
# Copy and edit environment file
cp .env.production.example .env
nano .env
```

Fill in all required values from the previous section.

### Step 3: Build and Start Services

```bash
# Build and start all containers
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
1. Build frontend (React + Vite)
2. Build backend (NestJS)
3. Create production image (~200MB)
4. Start PostgreSQL container
5. Start backend container
6. Create Docker network

**Build Output**:
```
[+] Building 145.2s (23/23) FINISHED
 => [frontend-builder 1/5] WORKDIR /app/frontend
 => [frontend-builder 5/5] RUN npm run build
 => [backend-builder 5/5] RUN npm run build
 => [production 8/8] CMD ["node", "dist/src/main.js"]
[+] Running 3/3
 ✔ Network whatsapp-network    Created
 ✔ Container whatsapp-db       Started
 ✔ Container whatsapp-backend  Started
```

### Step 4: Run Database Migrations

```bash
# Run migrations
docker compose exec backend npm run migration:run
```

**Expected Output**:
```
query: SELECT * FROM "migrations" ORDER BY "id" DESC
3 migrations are new migrations must be executed.
Migration CreateUsers1700000000000 has been executed successfully.
Migration CreateChatBots1700000000001 has been executed successfully.
Migration CreateConversations1700000000002 has been executed successfully.
```

### Step 5: Verify Deployment

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f backend

# Test health endpoint
curl http://localhost:3000/health
```

**Healthy Response**:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    }
  }
}
```

### Step 6: Access Application

**Without Cloudflare Tunnel**:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- Health: http://localhost:3000/health
- Swagger: http://localhost:3000/api/docs (disabled in production by default)

**With Cloudflare Tunnel** (see next section):
- Frontend: https://whatsapp.sipsy.ai
- API: https://whatsapp.sipsy.ai/api
- Health: https://whatsapp.sipsy.ai/health

---

## Health Checks

WhatsApp Builder includes comprehensive health check endpoints using `@nestjs/terminus`.

### Available Endpoints

#### 1. General Health Check
```bash
GET /health
```

Checks:
- Database connection
- Memory heap usage (<300MB)

**Response**:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" }
  }
}
```

#### 2. Liveness Probe
```bash
GET /health/liveness
```

Simple uptime check (container is running).

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-27T10:30:00.000Z"
}
```

#### 3. Readiness Probe
```bash
GET /health/readiness
```

Checks if dependencies are ready (database connection).

**Response**:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

### Docker Health Check

Health checks are configured in `Dockerfile`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

**Check Status**:
```bash
docker compose ps
# HEALTH column shows: starting, healthy, or unhealthy
```

---

## Cloudflare Tunnel Setup

Cloudflare Tunnel provides secure HTTPS access without exposing ports or managing SSL certificates.

### Benefits

- No public IP or port forwarding needed
- Automatic HTTPS with Cloudflare SSL
- DDoS protection by default
- Easy domain management
- Free tier available

### Setup Steps

#### 1. Create Cloudflare Tunnel

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Networks → Tunnels**
3. Click **Create a tunnel**
4. Choose **Cloudflared**
5. Name: `whatsapp-builder-tunnel`
6. Copy the tunnel token

#### 2. Configure Domain

1. Click **Add a public hostname**
2. Configure:
   - **Subdomain**: `whatsapp` (or your choice)
   - **Domain**: `sipsy.ai` (your domain)
   - **Type**: `HTTP`
   - **URL**: `backend:3000` (Docker service name)
3. Save

**Result**: https://whatsapp.sipsy.ai → your backend container

#### 3. Add Token to Environment

```bash
# Add to .env file
CLOUDFLARE_TUNNEL_TOKEN=your_copied_token_here
```

#### 4. Start with Tunnel

```bash
# Start all services including tunnel
docker compose -f docker-compose.prod.yml --profile tunnel up -d
```

**Verify Tunnel**:
```bash
# Check tunnel container
docker compose logs cloudflared

# Should see:
# Connection registered connIndex=0
# Registered tunnel connection
```

#### 5. Configure WhatsApp Webhook

Update webhook URL in Meta Developer Portal:

**Callback URL**: `https://whatsapp.sipsy.ai/api/webhooks/whatsapp`
**Verify Token**: (from your `.env` file)

---

## Maintenance

### Viewing Logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# PostgreSQL logs
docker compose logs -f postgres
```

### Restarting Services

```bash
# Restart all services
docker compose restart

# Restart backend only
docker compose restart backend

# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes data)
docker compose -f docker-compose.prod.yml down -v
```

### Database Backup

```bash
# Backup database
docker compose exec postgres pg_dump -U postgres whatsapp_builder > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker compose exec -T postgres psql -U postgres whatsapp_builder < backup_20251127_103000.sql
```

### Updating Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run new migrations (if any)
docker compose exec backend npm run migration:run
```

### Monitoring

```bash
# Resource usage
docker stats

# Container health
docker compose ps

# Disk usage
docker system df
```

---

## Troubleshooting

### Container Won't Start

**Check logs**:
```bash
docker compose logs backend
```

**Common issues**:
- Missing environment variables
- Database connection failed
- Port 3000 already in use

**Solutions**:
```bash
# Check environment file
cat .env

# Test database connection
docker compose exec postgres psql -U postgres -c "SELECT 1"

# Check port usage
lsof -i :3000
```

### Database Connection Failed

**Error**: `Error: connect ECONNREFUSED postgres:5432`

**Solution**:
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres

# Verify credentials in .env
echo $DB_PASSWORD
```

### Health Check Failing

**Check endpoint**:
```bash
curl http://localhost:3000/health
```

**If 503 Service Unavailable**:
```bash
# Check database connection
docker compose exec backend npm run typeorm -- query "SELECT 1"

# Check memory usage
docker stats backend
```

### Webhook Not Receiving Messages

**Checklist**:
1. Cloudflare Tunnel is running: `docker compose logs cloudflared`
2. Webhook URL is correct in Meta Dashboard
3. Verify token matches `.env` file
4. Check signature verification logs

**Test webhook**:
```bash
# Manual test
curl -X POST https://whatsapp.sipsy.ai/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Container Out of Memory

**Check memory**:
```bash
docker stats backend
```

**Increase limits** in `docker-compose.prod.yml`:
```yaml
backend:
  deploy:
    resources:
      limits:
        memory: 1G
      reservations:
        memory: 512M
```

### Migrations Failed

**Error**: `Migration has already been applied`

**Solution**:
```bash
# Check migrations table
docker compose exec postgres psql -U postgres whatsapp_builder \
  -c "SELECT * FROM migrations ORDER BY id DESC"

# Revert last migration
docker compose exec backend npm run migration:revert

# Run migrations again
docker compose exec backend npm run migration:run
```

---

## Production Checklist

Before going live, verify:

- [ ] All environment variables are set correctly
- [ ] Strong database password is used
- [ ] Cloudflare Tunnel is configured (or alternative HTTPS)
- [ ] WhatsApp webhook URL is updated in Meta Dashboard
- [ ] Health checks are passing: `/health`, `/health/liveness`, `/health/readiness`
- [ ] Database backups are configured
- [ ] Container auto-restart is enabled (`restart: unless-stopped`)
- [ ] Logs are being captured
- [ ] Resource limits are appropriate
- [ ] Migrations are up to date
- [ ] SSL certificate is valid (via Cloudflare or custom)
- [ ] Webhook signature verification is working
- [ ] Test message flow is successful

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/whatsapp-builder/issues
- Documentation: See `docs/` folder
- WhatsApp API Docs: https://developers.facebook.com/docs/whatsapp

---

## License

[Your License Here]
