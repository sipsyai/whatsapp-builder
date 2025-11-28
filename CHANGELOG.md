# Changelog

All notable changes to WhatsApp Builder project.

## [Latest] - 2025-11-28

### WhatsApp Flows Playground Bug Fixes

#### Fixed
- **WhatsApp Flows ID Format** - Screen and component IDs now use underscores
  - Changed ID generation from hyphen format (`screen-123`) to underscore format (`screen_123`)
  - Affected files:
    - `frontend/src/features/flow-builder/hooks/useFlowBuilder.ts`
  - Reason: WhatsApp Flows API only accepts alphanumeric characters and underscores
  - ID regex: `/^[a-zA-Z0-9_]+$/`

- **data-source Property Name** - Corrected to hyphenated format
  - Changed from camelCase `dataSource` to hyphenated `'data-source'`
  - Affected components: RadioButtonsGroup, CheckboxGroup, Dropdown
  - Affected file:
    - `frontend/src/features/flow-builder/components/playground/constants/contentCategories.ts`
  - Ensures compliance with WhatsApp Flow JSON schema specification

- **Default Flow Template** - Fixed initial flow structure in FlowsPage
  - Added proper END screen with `terminal: true` and `success: true`
  - Previous template only had START screen navigating to non-existent END screen
  - Affected file:
    - `frontend/src/features/flows/components/FlowsPage.tsx`
  - Now creates valid two-screen flow (START → END)

#### Improved
- **AddContentMenu UX** - Menu position improvement
  - Menu now opens upward (`bottom-full mb-2`) instead of downward
  - Prevents menu overflow on screens with limited vertical space
  - Affected file:
    - `frontend/src/features/flow-builder/components/playground/ContentEditor/AddContentMenu.tsx`

#### Documentation
- Updated `docs/features/WHATSAPP_FLOWS_PLAYGROUND.md` - Added changelog section with bug fix details
- Updated `docs/META_PLAYGROUND_IMPLEMENTATION.md` - Corrected Flow JSON examples
- Updated `docs/FLOW_BUILDER_ANALYSIS.md` - Added recent improvements section
- All documentation now reflects correct ID format and property names

---

## [2025-11-27] - Production Deployment

### Production Deployment

#### Added
- **Docker Production Deployment**
  - Multi-stage Dockerfile (Frontend + Backend in single container)
  - `docker-compose.prod.yml` for production orchestration
  - `.dockerignore` for optimized builds
  - Non-root user security (`nestjs:nodejs`)
  - Health check in Dockerfile (~30s interval)
  - Production image size: ~200MB (optimized)

- **Health Check Endpoints** (@nestjs/terminus)
  - `GET /health` - Full health check (database, memory)
  - `GET /health/liveness` - Liveness probe for orchestration
  - `GET /health/readiness` - Readiness probe for dependencies
  - Health module: `backend/src/modules/health/`

- **Cloudflare Tunnel Integration**
  - Optional secure HTTPS without port forwarding
  - Docker profile: `--profile tunnel`
  - Environment variable: `CLOUDFLARE_TUNNEL_TOKEN`
  - Production URL: https://whatsapp.sipsy.ai

#### Changed
- **Backend Structure**
  - `app.controller.ts` - Root route moved to `/api/status`
  - `app.module.ts` - Added `ServeStaticModule` for frontend serving
  - `app.module.ts` - Added `HealthModule`
  - `main.ts` - Swagger disabled in production
  - `main.ts` - Production CORS configuration
  - Environment variables renamed:
    - `WHATSAPP_PHONE_NUMBER_ID` → `PHONE_NUMBER_ID`
    - `WHATSAPP_WEBHOOK_VERIFY_TOKEN` → `WEBHOOK_VERIFY_TOKEN`

- **Frontend Production Build**
  - Frontend static files served by NestJS (single container)
  - `client.ts` - Relative URLs in production
  - `socket.ts` - `window.location.origin` in production
  - `ConfigRestApi.tsx` - Relative URL for API base
  - No separate frontend container needed

- **Package Updates**
  - Backend: Added `@nestjs/serve-static` (^4.0.2)
  - Backend: Added `@nestjs/terminus` (^10.2.3)

#### Documentation
- Created `docs/PRODUCTION_DEPLOYMENT.md` - Complete production setup guide
- Created `docs/TAILWIND_CSS_V4.md` - Tailwind CSS v4 configuration guide
- Updated `README.md` - Added Docker deployment section
- Updated `.claude/skills/project-architect/reference/10-deployment-architecture.md`
- Updated `.claude/skills/project-architect/reference/09-development-guide.md`

### Tailwind CSS v4 Migration

#### Added
- **Tailwind CSS v4**
  - PostCSS integration (`@tailwindcss/postcss`)
  - `frontend/postcss.config.js` - PostCSS configuration
  - `frontend/tailwind.config.js` - Custom theme (colors, fonts)
  - `frontend/src/styles/index.css` - Tailwind v4 syntax (`@import`, `@theme`)

#### Changed
- **Package Updates**
  - Frontend: `tailwindcss` updated to `^4.0.0`
  - Frontend: Added `@tailwindcss/postcss` (^4.0.0)
  - Frontend: Added `postcss` (^8.4.47)
  - Frontend: Added `autoprefixer` (^10.4.20)

#### Removed
- Tailwind CSS CDN script from `index.html`
- Inline Tailwind configuration from HTML

#### Benefits
- Build-time CSS processing (faster page loads)
- Optimized bundle size (~50KB gzipped vs 3.5MB full)
- Better IDE support (IntelliSense)
- Production-ready optimizations

### Bug Fixes
- Fixed production URL configuration (relative URLs)
- Fixed Socket.IO connection in production (window.location.origin)
- Fixed CORS configuration for production environment

---

## Previous Changes

### [Earlier] - 2025-11

#### Features
- Auto Layout System with Dagre algorithm
- WhatsApp Flows Management
- REST API Integration in flows
- Dynamic Lists and Buttons
- Session Management with WebSocket
- AI-powered flow generation (Google Gemini)
- Interactive message support (Buttons, Lists)
- Webhook handling with signature verification

#### Tech Stack
- Backend: NestJS 11.0.1, TypeORM 0.3.27, PostgreSQL 14+
- Frontend: React 19.2.0, ReactFlow 12.3.5, Vite 7.2.5
- Real-time: Socket.IO 4.8.1
- AI: Google Generative AI 1.30.0

---

## Deployment Summary

### Current Production Setup
```
┌─────────────────────────┐
│  Cloudflare Tunnel      │
│  whatsapp.sipsy.ai      │
└───────────┬─────────────┘
            │ HTTPS
            ▼
┌─────────────────────────┐
│  Docker Container       │
│  - Frontend (Static)    │
│  - Backend (NestJS)     │
│  Port: 3000             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  PostgreSQL 15          │
│  Port: 5432             │
└─────────────────────────┘
```

### Quick Deploy
```bash
# 1. Configure environment
cp .env.production.example .env
nano .env

# 2. Build and start
docker compose -f docker-compose.prod.yml up -d --build

# 3. Run migrations
docker compose exec backend npm run migration:run

# 4. (Optional) Start with Cloudflare Tunnel
docker compose -f docker-compose.prod.yml --profile tunnel up -d
```

### Health Check
```bash
curl https://whatsapp.sipsy.ai/health
```

---

## Breaking Changes

### Environment Variables
Old names (deprecated):
- `WHATSAPP_PHONE_NUMBER_ID` → Use `PHONE_NUMBER_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` → Use `WEBHOOK_VERIFY_TOKEN`

### Frontend Environment Variables
- `VITE_API_URL` - Optional in production (uses relative URLs)
- `VITE_WS_URL` - Optional in production (uses window.location.origin)

### Docker Deployment
- Frontend now served by backend container (no separate frontend container)
- Single Docker image for both frontend and backend
- PostgreSQL requires persistent volume configuration

---

## Migration Guide

### From CDN Tailwind to Build-time

**Before**:
```html
<script src="https://cdn.tailwindcss.com"></script>
```

**After**:
```bash
npm install --save-dev tailwindcss@4 @tailwindcss/postcss
```

### From Separate Containers to Single Container

**Before** (`docker-compose.yml`):
```yaml
services:
  frontend:
    build: ./frontend
  backend:
    build: ./backend
```

**After** (`docker-compose.prod.yml`):
```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
```

---

## Contributors

- Ali - Production deployment, Tailwind CSS v4, documentation

---

## Support

- GitHub: https://github.com/yourusername/whatsapp-builder
- Documentation: `docs/` folder
- Production Guide: `docs/PRODUCTION_DEPLOYMENT.md`
