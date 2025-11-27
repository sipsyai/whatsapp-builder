# Deployment Architecture - WhatsApp Builder

## Table of Contents
- [Overview](#overview)
- [Infrastructure Components](#infrastructure-components)
- [Deployment Strategies](#deployment-strategies)
- [Environment Configuration](#environment-configuration)
- [Scaling Considerations](#scaling-considerations)
- [Monitoring & Logging](#monitoring--logging)
- [Security Best Practices](#security-best-practices)
- [CI/CD Pipeline](#cicd-pipeline)

---

## Overview

This document outlines production deployment considerations for WhatsApp Builder. The architecture is designed to be deployed on cloud platforms (AWS, GCP, Azure) or self-hosted infrastructure.

**Current Production Deployment**: https://whatsapp.sipsy.ai
- **Docker-based**: Single container deployment (Frontend + Backend)
- **Cloudflare Tunnel**: Secure HTTPS without port forwarding
- **PostgreSQL**: Persistent database with health checks
- **Dark Mode UI**: Optimized interface for messaging environments

### Deployment Goals
1. **High Availability**: 99.9% uptime for message delivery
2. **Scalability**: Handle growing user base and message volume
3. **Security**: Protect sensitive WhatsApp credentials and user data
4. **Performance**: Low latency for real-time messaging
5. **Cost-Efficiency**: Optimize infrastructure costs

---

## Infrastructure Components

### Required Services
```
┌─────────────────────────────────────────────────────┐
│                  Load Balancer                       │
│              (Nginx / AWS ALB / GCP LB)              │
└─────────────┬───────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────┐       ┌─────────┐
│ Backend │       │ Backend │
│ Node 1  │       │ Node 2  │
│ (NestJS)│       │ (NestJS)│
└────┬────┘       └────┬────┘
     │                 │
     └────────┬────────┘
              │
              ▼
      ┌───────────────┐
      │  PostgreSQL   │
      │   (Primary)   │
      └───────────────┘
              │
              ▼
      ┌───────────────┐
      │  PostgreSQL   │
      │   (Replica)   │
      └───────────────┘

┌─────────────────┐
│   Frontend      │
│   (Static CDN)  │
└─────────────────┘

┌─────────────────┐
│  Redis Cache    │
│  (Optional)     │
└─────────────────┘
```

### Component Details

#### 1. Load Balancer
**Purpose**: Distribute traffic across multiple backend instances

**Options**:
- **Nginx**: Self-hosted, highly configurable
- **AWS Application Load Balancer**: Managed, auto-scaling
- **GCP Load Balancer**: Global load balancing
- **Azure Load Balancer**: Regional load balancing

**Configuration**:
```nginx
# Nginx example
upstream backend {
  least_conn;
  server backend1:3000;
  server backend2:3000;
}

server {
  listen 443 ssl http2;
  server_name api.whatsapp-builder.com;

  ssl_certificate /etc/ssl/certs/cert.pem;
  ssl_certificate_key /etc/ssl/private/key.pem;

  location /api {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location /socket.io {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

#### 2. Backend Servers
**Technology**: NestJS on Node.js 20+

**Deployment Options**:
- **Docker Containers**: AWS ECS, GCP Cloud Run, Azure Container Instances
- **Kubernetes**: AWS EKS, GCP GKE, Azure AKS
- **VM Instances**: AWS EC2, GCP Compute Engine, Azure VMs
- **Cloudflare Tunnel**: Secure HTTPS without port forwarding

**Production Docker Image** (Multi-stage: Frontend + Backend):
```dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY backend/package*.json ./
RUN npm ci --only=production
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./public
RUN chown -R nestjs:nodejs /app
USER nestjs
EXPOSE 3000
HEALTHCHECK CMD wget --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/src/main.js"]
```

**Features**:
- Single container serves both frontend and backend
- Non-root user for security
- Health check endpoint
- Production optimized (~200MB image)
- Frontend served via NestJS `ServeStaticModule`

#### 3. Database (PostgreSQL)
**Configuration**:
- **Primary**: Write operations
- **Read Replicas**: Read operations (optional for high read load)
- **Backups**: Daily automated backups with point-in-time recovery
- **Connection Pooling**: PgBouncer or built-in pooling

**Managed Database Services**:
- **AWS RDS for PostgreSQL**: Automated backups, multi-AZ
- **GCP Cloud SQL**: High availability, automatic failover
- **Azure Database for PostgreSQL**: Built-in security

**Connection Pool Settings** (production):
```typescript
// database.config.ts
extra: {
  max: 50,                      // Increase for production
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  min: 10,                      // Minimum pool size
}
```

#### 4. Frontend (Static CDN)
**Deployment**:
- Build static assets: `npm run build`
- Deploy to CDN: CloudFront, Cloudflare, Netlify, Vercel

**Build Configuration**:
```bash
# Build for production
cd frontend
VITE_API_URL=https://api.whatsapp-builder.com \
VITE_SOCKET_URL=https://api.whatsapp-builder.com \
npm run build

# Output: dist/ directory with optimized static files
```

**CDN Configuration**:
```yaml
# Example: CloudFront
Distribution:
  Origins:
    - DomainName: whatsapp-builder.s3.amazonaws.com
      S3OriginConfig: {}
  DefaultCacheBehavior:
    TargetOriginId: S3-whatsapp-builder
    ViewerProtocolPolicy: redirect-to-https
    Compress: true
    CachePolicyId: CachingOptimized
```

#### 5. Redis Cache (Optional)
**Use Cases**:
- Session storage
- Rate limiting
- Caching frequently accessed data
- Socket.IO adapter for multi-instance WebSocket support

**Socket.IO Multi-Instance Setup**:
```typescript
// main.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

app.useWebSocketAdapter(new IoAdapter(app));
const io = app.get(WebSocketServer);
io.adapter(createAdapter(pubClient, subClient));
```

---

## Deployment Strategies

### 1. Docker Compose (Production)

WhatsApp Builder now uses a **single Docker image** that serves both frontend and backend, optimized for production deployment.

**Architecture**:
- Multi-stage Docker build (Frontend → Backend → Production)
- NestJS `ServeStaticModule` serves frontend static files
- PostgreSQL container with persistent volume
- Optional Cloudflare Tunnel for secure HTTPS

**File**: `docker-compose.prod.yml`

```yaml
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: whatsapp-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
      POSTGRES_DB: ${DB_NAME:-whatsapp_builder}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - whatsapp-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend + Frontend (Single Container)
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: whatsapp-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN}
      # ... other env vars
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Cloudflare Tunnel (Optional)
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    profiles:
      - tunnel

networks:
  whatsapp-network:

volumes:
  postgres_data:
```

**Deployment Steps**:
```bash
# 1. Create environment file
cp .env.production.example .env
nano .env

# 2. Build and start
docker compose -f docker-compose.prod.yml up -d --build

# 3. Run migrations
docker compose exec backend npm run migration:run

# 4. (Optional) Start with Cloudflare Tunnel
docker compose -f docker-compose.prod.yml --profile tunnel up -d
```

**Multi-Stage Dockerfile**:
```dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Install production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy built artifacts
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./public

# Health check
HEALTHCHECK --interval=30s --timeout=10s \
  CMD wget --spider http://localhost:3000/health || exit 1

USER nestjs
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
```

### 2. Health Check Endpoints

WhatsApp Builder includes comprehensive health check endpoints powered by `@nestjs/terminus`:

**File**: `backend/src/modules/health/health.controller.ts`

```typescript
@Controller('health')
export class HealthController {
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('liveness')
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

**Endpoints**:
- `GET /health` - Full health check (database connection, memory usage)
- `GET /health/liveness` - Simple liveness probe (container is running)
- `GET /health/readiness` - Readiness probe (dependencies are ready)

**Usage in Docker**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --spider http://localhost:3000/health || exit 1
```

**Usage in Kubernetes**:
```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 3. Cloudflare Tunnel Integration

Production deployment uses Cloudflare Tunnel for secure HTTPS access without port forwarding:

**Benefits**:
- No public IP or port forwarding needed
- Automatic HTTPS with Cloudflare SSL
- DDoS protection by default
- Easy domain management

**Setup**:
```bash
# 1. Create tunnel in Cloudflare Dashboard
# 2. Copy tunnel token
# 3. Add to .env
CLOUDFLARE_TUNNEL_TOKEN=your_token_here

# 4. Start with tunnel profile
docker compose -f docker-compose.prod.yml --profile tunnel up -d
```

**Production URL**: https://whatsapp.sipsy.ai

### 4. Kubernetes (Production)
**Deployment Manifest**:

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: whatsapp-builder-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: whatsapp-builder-backend
  template:
    metadata:
      labels:
        app: whatsapp-builder-backend
    spec:
      containers:
      - name: backend
        image: your-registry/whatsapp-builder-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: whatsapp-builder-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 3. AWS ECS (Production)
**Task Definition**:
```json
{
  "family": "whatsapp-builder-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-ecr-repo/whatsapp-builder-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/whatsapp-builder",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

---

## Environment Configuration

### Production Environment Variables

#### Backend
```bash
# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.whatsapp-builder.com

# Database
DB_HOST=your-db-host.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<stored-in-secrets-manager>
DB_NAME=whatsapp_builder
DB_LOGGING=false
DB_SSL=true

# WhatsApp API
WHATSAPP_PHONE_NUMBER_ID=<from-meta>
WHATSAPP_ACCESS_TOKEN=<stored-in-secrets-manager>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<stored-in-secrets-manager>
WHATSAPP_APP_SECRET=<stored-in-secrets-manager>

# Redis (if used)
REDIS_URL=redis://your-redis-host:6379

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

#### Frontend
```bash
VITE_API_URL=https://api.whatsapp-builder.com
VITE_SOCKET_URL=https://api.whatsapp-builder.com
```

### Secrets Management
**Never store secrets in code or environment files in production.**

**Options**:
- **AWS Secrets Manager**: Rotate credentials automatically
- **GCP Secret Manager**: IAM-based access control
- **Azure Key Vault**: Integrated with Azure services
- **HashiCorp Vault**: Self-hosted secrets management

**Example (AWS Secrets Manager)**:
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

async function getSecret(secretName: string): Promise<string> {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString;
}

// Use in app
const dbPassword = await getSecret('db-password');
```

---

## Scaling Considerations

### Horizontal Scaling
**Backend**: Add more instances behind load balancer
- Auto-scaling based on CPU/memory usage
- Socket.IO: Use Redis adapter for multi-instance support
- Stateless design: No session storage on instances

**Database**: Read replicas for read-heavy operations
- Primary for writes
- Replicas for reads (conversations, messages)

### Vertical Scaling
**Backend**: Increase CPU/memory per instance
- Node.js: Single-threaded, benefit from more CPU for concurrent connections
- Memory: Increase for larger in-memory caches

**Database**: Upgrade instance size
- More RAM for query caching
- More CPU for complex queries

### Performance Optimization
1. **Database Indexes**: Ensure proper indexes (see `04-database-design.md`)
2. **Connection Pooling**: Optimize pool size based on load
3. **Caching**: Redis for frequently accessed data
4. **CDN**: Static assets served from edge locations
5. **Compression**: Gzip/Brotli for HTTP responses

---

## Monitoring & Logging

### Logging Strategy
**Structured Logging**:
```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('AppName');

logger.log({
  message: 'User action',
  userId: '123',
  action: 'send_message',
  timestamp: new Date().toISOString(),
});
```

**Log Aggregation**:
- **AWS CloudWatch Logs**: Native AWS integration
- **GCP Cloud Logging**: Automatic collection
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Datadog**: Full-stack monitoring

### Monitoring Metrics
**Application Metrics**:
- Request rate (req/sec)
- Response time (avg, p95, p99)
- Error rate (%)
- Active WebSocket connections
- Database query time

**Infrastructure Metrics**:
- CPU usage (%)
- Memory usage (%)
- Disk I/O
- Network I/O
- Database connections

**Business Metrics**:
- Messages sent/received per day
- Active conversations
- Chatbot execution success rate
- WhatsApp API error rate

### Monitoring Tools
- **Prometheus + Grafana**: Open-source monitoring
- **Datadog**: All-in-one monitoring and logging
- **New Relic**: APM and infrastructure monitoring
- **Sentry**: Error tracking and performance monitoring

**Health Check Endpoint**:
```typescript
// app.controller.ts
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await this.checkDatabaseHealth(),
  };
}
```

---

## Security Best Practices

### 1. HTTPS/TLS
- Use SSL certificates (Let's Encrypt, AWS ACM)
- Force HTTPS redirects
- TLS 1.2+ only

### 2. Environment Variables
- Never commit secrets to Git
- Use secrets managers
- Rotate credentials regularly

### 3. Database Security
- Use strong passwords
- Enable SSL connections
- Restrict network access (VPC/private subnets)
- Regular backups with encryption

### 4. API Security
- Rate limiting (prevent abuse)
- Input validation (class-validator)
- SQL injection prevention (TypeORM parameterized queries)
- CORS configuration (restrict origins)

### 5. WhatsApp Webhook Security
- Verify webhook signatures
- Use HTTPS endpoints only
- Validate verify token

### 6. Authentication (Future)
- JWT tokens for user authentication
- Refresh token rotation
- Password hashing (bcrypt)

---

## CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      - name: Run tests
        run: |
          cd backend && npm test
      - name: Run linters
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t whatsapp-builder-backend:${{ github.sha }} ./backend
          docker build -t whatsapp-builder-frontend:${{ github.sha }} ./frontend
      - name: Push to registry
        run: |
          docker push whatsapp-builder-backend:${{ github.sha }}
          docker push whatsapp-builder-frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster whatsapp-builder-cluster \
            --service backend-service \
            --force-new-deployment
```

---

## Disaster Recovery

### Backup Strategy
1. **Database Backups**:
   - Automated daily backups
   - Point-in-time recovery (7-30 days retention)
   - Cross-region replication

2. **Application State**:
   - Chatbot configurations (database)
   - Message history (database)
   - Media files (S3 with versioning)

3. **Configuration Backups**:
   - Infrastructure as Code (Terraform, CloudFormation)
   - Environment variables (Secrets Manager)

### Recovery Procedures
1. **Database Failure**: Promote read replica to primary
2. **Application Failure**: Auto-scaling launches new instances
3. **Region Failure**: Failover to standby region
4. **Data Loss**: Restore from most recent backup

---

## Cost Optimization

### Infrastructure Costs
- **Compute**: Right-size instances, use spot instances for non-critical workloads
- **Database**: Reserved instances for predictable workloads
- **Storage**: Lifecycle policies for old data (S3 Glacier)
- **Network**: CDN caching reduces origin requests

### Monitoring Costs
- Set up billing alerts
- Use cost allocation tags
- Review monthly cost reports

---

## Summary

### Production Checklist
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database backups configured
- [ ] Secrets stored in secrets manager
- [ ] Health check endpoint implemented
- [ ] Monitoring and alerting configured
- [ ] Logging aggregation set up
- [ ] CI/CD pipeline automated
- [ ] Auto-scaling configured
- [ ] Load balancer configured
- [ ] CDN configured for frontend
- [ ] Rate limiting implemented
- [ ] Error tracking (Sentry) configured
- [ ] Documentation updated
- [ ] Disaster recovery plan documented

---

**End of Reference Documentation**
