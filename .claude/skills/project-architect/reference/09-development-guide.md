# Development Guide - WhatsApp Builder

## Prerequisites

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **npm**: 9.x or higher
- **ngrok**: Latest version (for webhook development)
- **Git**: For version control

---

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/whatsapp-builder.git
cd whatsapp-builder
```

### 2. Install Dependencies
```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Or install separately
npm run backend:install
npm run frontend:install
```

### 3. Setup PostgreSQL Database
```bash
# Create database
createdb whatsapp_builder

# Or using psql
psql -U postgres
CREATE DATABASE whatsapp_builder;
\q
```

### 4. Configure Environment Variables

**Backend** (`.env` in `/backend` directory):
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=whatsapp_builder
DB_LOGGING=true

# Application
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# WhatsApp API (get from Meta Developer Portal)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_APP_SECRET=your_app_secret
```

**Frontend** (`.env` in `/frontend` directory):
```bash
# Backend API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000

# AI Flow Generation (Optional)
VITE_API_KEY=your_gemini_api_key
```

**Frontend Environment Variables Explained**:

| Variable | Required | Default | Description | Usage |
|----------|----------|---------|-------------|-------|
| `VITE_API_URL` | Yes | `http://localhost:3000` | Base URL for backend REST API | Used in `/frontend/src/api/client.ts` for Axios base URL. All HTTP requests (chatbots, conversations, messages) use this URL. |
| `VITE_WS_URL` | Yes | `http://localhost:3000` | Base URL for WebSocket connection | Used in `/frontend/src/api/socket.ts` for Socket.IO connection. Real-time message updates use this URL. |
| `VITE_API_KEY` | No | - | Google Gemini API key for AI flow generation | Used in `/frontend/src/features/builder/components/BuilderPage.tsx` (line 221). Required only if using "AI Build" feature. Get from [Google AI Studio](https://makersuite.google.com/app/apikey). |

**Environment Variable Usage in Code**:

1. **VITE_API_URL** - REST API Client:
```typescript
// File: frontend/src/api/client.ts
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

2. **VITE_WS_URL** - WebSocket Connection:
```typescript
// File: frontend/src/api/socket.ts
const URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const socket = io(`${URL}/messages`, {
  autoConnect: false,
  query: {
    userId: 'user-123',  // TODO: Get from auth context
  },
});
```

3. **VITE_API_KEY** - AI Flow Generation:
```typescript
// File: frontend/src/features/builder/components/BuilderPage.tsx
const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) {
  alert("Please set VITE_API_KEY in .env file");
  return;
}

const ai = new GoogleGenAI({ apiKey });
```

**Production Configuration**:
```bash
# Production example
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=https://api.yourdomain.com
VITE_API_KEY=your_production_gemini_key
```

**Important Notes**:
- All Vite environment variables must start with `VITE_` prefix to be exposed to client
- Variables are embedded at build time (not runtime)
- Sensitive keys (like VITE_API_KEY) are exposed to browser - consider server-side proxy for production
- Create `.env.local` for local overrides (gitignored by default)

### 5. Run Database Migrations
```bash
cd backend
npm run migration:run
```

Expected output:
```
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = current_schema() AND "table_name" = 'migrations'
query: SELECT * FROM "migrations" "migrations" ORDER BY "id" DESC
0 migrations are already loaded in the database.
3 migrations were found in the source code.
3 migrations are new migrations must be executed.
...
Migration CreateWhatsAppConfigTable1732402800000 has been  executed successfully.
Migration CreateConversationContextTable1732459200000 has been  executed successfully.
Migration RenameFlowsToChatBots1763984202000 has been  executed successfully.
```

---

## Development Workflows

### Option 1: Full Stack with Webhooks (Recommended)
Start backend + ngrok for WhatsApp webhook testing:
```bash
# From project root
npm run webhook:start
```

This script:
1. Starts NestJS backend on port 3000
2. Launches ngrok tunnel
3. Displays webhook URL and setup instructions

In another terminal, start frontend:
```bash
npm run frontend:dev
```

### Option 2: Backend Only
```bash
cd backend
npm run start:dev
```

### Option 3: Frontend Only
```bash
cd frontend
npm run dev
```

---

## Available Scripts

### Root Scripts (`package.json`)
```bash
npm run webhook:start       # Start backend + ngrok
npm run webhook:stop        # Stop all services
npm run webhook:url         # Display current webhook URL
npm run backend:dev         # Start backend only
npm run frontend:dev        # Start frontend only
npm run backend:install     # Install backend deps
npm run frontend:install    # Install frontend deps
npm run install:all         # Install all deps
npm run migration:run       # Run database migrations
```

### Backend Scripts
```bash
npm run start               # Production start
npm run start:dev           # Development (watch mode)
npm run start:debug         # Debug mode
npm run build               # Build for production
npm run lint                # Run ESLint
npm run test                # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:cov            # Run tests with coverage
npm run test:e2e            # Run end-to-end tests

# Database
npm run typeorm             # Run TypeORM CLI
npm run migration:generate  # Generate migration
npm run migration:create    # Create empty migration
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration

# WhatsApp testing scripts
npm run flow:publish        # Publish WhatsApp Flow
npm run flow:send-test      # Send test Flow message
npm run test:send-text      # Send test text message
npm run test:media-upload   # Test media upload
```

### Frontend Scripts
```bash
npm run dev                 # Development server (Vite)
npm run build               # Build for production
npm run preview             # Preview production build
npm run lint                # Run ESLint
```

---

## WhatsApp Webhook Setup

### 1. Start Webhook Development Environment
```bash
npm run webhook:start
```

Output will show:
```
🚀 Webhook Development Environment
===========================================

✅ Backend started on port 3000
✅ ngrok tunnel created

🔗 Webhook URL:
https://abc123.ngrok.io/api/webhooks/whatsapp

📋 Setup Instructions:
1. Go to: https://developers.facebook.com/apps
2. Select your app → WhatsApp → Configuration
3. Edit Callback URL:
   - Callback URL: https://abc123.ngrok.io/api/webhooks/whatsapp
   - Verify token: your_verify_token_from_env
4. Subscribe to 'messages' webhook field

✅ Ready to receive webhooks!
```

### 2. Configure Meta Developer Portal
1. Go to [Meta for Developers](https://developers.facebook.com/apps)
2. Select your WhatsApp app
3. Navigate to: **WhatsApp → Configuration**
4. Click **Edit** on Webhook section
5. Enter:
   - **Callback URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp`
   - **Verify Token**: Value from `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env`
6. Click **Verify and Save**
7. Subscribe to **messages** webhook field

### 3. Test Webhook
Send a message to your WhatsApp Business number from your phone.

Check backend logs:
```bash
tail -f logs/backend-*.log
```

Expected log output:
```
[MessagesGateway] WebSocket Gateway initialized
[WebhooksController] Webhook payload received
[WebhookProcessorService] Processing 1 incoming message(s)
[ChatBotExecutionService] Starting chatbot for conversation abc-123
[ChatBotExecutionService] Found chatbot with START node
[TextMessageService] Sending text message to 1234567890
[MessagesGateway] Message emitted to conversation abc-123
```

---

## Database Management

### Create a New Migration
```bash
cd backend

# Generate migration from entity changes
npm run migration:generate -- src/migrations/AddNewField

# Or create empty migration
npm run migration:create -- src/migrations/CustomMigration
```

### Run Migrations
```bash
npm run migration:run
```

### Revert Last Migration
```bash
npm run migration:revert
```

### Reset Database (Development Only)
```bash
# Drop database
dropdb whatsapp_builder

# Recreate database
createdb whatsapp_builder

# Run migrations
cd backend
npm run migration:run
```

---

## Testing

### Backend Unit Tests
```bash
cd backend
npm run test
```

### Backend E2E Tests
```bash
cd backend
npm run test:e2e
```

### Manual API Testing
Use tools like:
- **Postman**: Import backend endpoints
- **curl**: Command-line testing
- **Thunder Client**: VS Code extension

Example:
```bash
# Get all chatbots
curl http://localhost:3000/api/chatbots

# Create chatbot
curl -X POST http://localhost:3000/api/chatbots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bot",
    "nodes": [{"id":"start-1","type":"start","position":{"x":0,"y":0},"data":{}}],
    "edges": []
  }'
```

---

## Debugging

### Backend Debugging (VS Code)
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "port": 9229,
      "restart": true,
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

### Frontend Debugging
Use browser DevTools:
- **React DevTools**: Inspect component tree
- **Network Tab**: Monitor API calls
- **Console**: Check WebSocket events

---

## Common Issues

### Issue: Database Connection Failed
**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql@14

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Check connection settings in backend/.env
```

### Issue: Migrations Not Running
**Error**: `QueryFailedError: relation "users" does not exist`

**Solution**:
```bash
cd backend
npm run migration:run
```

### Issue: ngrok Tunnel Expired
**Error**: Webhook not receiving messages

**Solution**:
```bash
# Restart webhook environment
npm run webhook:stop
npm run webhook:start

# Update Meta Developer Portal with new URL
```

### Issue: CORS Errors
**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: Check `backend/src/main.ts`:
```typescript
app.enableCors();
```

Ensure frontend URL is correct in backend `.env`:
```bash
FRONTEND_URL=http://localhost:5173
```

---

## Development Best Practices

### 1. Code Style
- Run linters before committing:
  ```bash
  cd backend && npm run lint
  cd frontend && npm run lint
  ```

### 2. Database Migrations
- Always create migrations for schema changes
- Never use `synchronize: true` in production
- Test migrations with `revert` before deploying

### 3. Environment Variables
- Never commit `.env` files
- Use `.env.example` as template
- Document all required variables

### 4. Git Workflow
```bash
# Feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

---

## Production Deployment

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Environment Setup
- Set `NODE_ENV=production`
- Use production database credentials
- Configure HTTPS for webhooks (no ngrok)
- Set up proper logging and monitoring

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [React Documentation](https://react.dev)
- [TypeORM Documentation](https://typeorm.io)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [ReactFlow Documentation](https://reactflow.dev)
- [Socket.IO Documentation](https://socket.io/docs)

---

**Next**: See `10-deployment-architecture.md` for production deployment.
