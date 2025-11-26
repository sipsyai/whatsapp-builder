# WhatsApp Builder

A powerful WhatsApp chatbot builder with visual flow designer and conversation management.

## 🌟 Features

### Visual Flow Builder
- Drag-and-drop interface powered by React Flow
- **Auto Layout System** with Dagre algorithm
  - 4 layout directions: Top-to-Bottom (TB), Left-to-Right (LR), Bottom-to-Top (BT), Right-to-Left (RL)
  - Customizable node spacing and rank separation
  - One-click automatic node organization
  - Implemented in `frontend/src/features/builder/utils/autoLayout.ts`
- AI-powered flow generation using Google Gemini
- Real-time flow validation and preview
- Custom node types: Start, Message, Question, Condition, WhatsApp Flow, REST API

### WhatsApp Integration
- WhatsApp Business API integration
- **WhatsApp Flows Management**
  - Create and manage WhatsApp Flows
  - Visual Flow Builder with drag-and-drop interface
  - Real-time validation with error reporting
  - Export/Import Flow JSON
  - Sync flows from Meta/Facebook API
  - Publish and preview flows
  - Use flows in ChatBot nodes
- Interactive message support (Buttons, Lists)
- Dynamic list and button generation
- Webhook handling with signature verification

### Chatbot Features
- **REST API Integration** in flows
  - Dynamic content from external APIs
  - Variable substitution in API calls
  - Response data extraction and storage
- **Dynamic Lists and Buttons**
  - Generate interactive elements from API responses
  - Template-based message customization
- Conditional logic and branching
- Variable storage and substitution
- State management and context tracking

### Session Management
- **Real-time Session Tracking** with WebSocket
- Active and completed session views
- Conversation logs with enhanced message metadata
- Bot/user message differentiation
- WhatsApp Flow response visualization (nfm_reply)
- Session timeline and variable tracking
- Session control (stop active sessions)

### Real-time Communication
- Socket.IO integration for live updates
- Message delivery status tracking
- Typing indicators
- Online/offline user status

## 📁 Project Structure

- **backend/**: NestJS backend with WhatsApp API integration
- **frontend/**: React + Vite frontend with React Flow
- **scripts/**: Development and deployment scripts
- **docs/**: Comprehensive documentation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment

Copy `.env.example` to `.env` in the backend directory and configure your WhatsApp credentials.

### 3. Run Database Migrations

```bash
npm run migration:run
```

### 4. Start Development with Webhooks

This command starts both backend and ngrok for WhatsApp webhook integration:

```bash
npm run webhook:start
```

The script will:
- Start the backend server on port 3000
- Launch ngrok and provide a public URL
- Display instructions for Meta Dashboard webhook configuration

### 5. Configure WhatsApp Webhook

Follow the instructions displayed by the script or check [WEBHOOK_QUICKSTART.md](./WEBHOOK_QUICKSTART.md)

## 📋 Available Commands

### Webhook Commands
- `npm run webhook:start` - Start backend and ngrok together
- `npm run webhook:stop` - Stop all webhook services
- `npm run webhook:url` - Display current webhook URL

### Development Commands
- `npm run backend:dev` - Start backend only
- `npm run frontend:dev` - Start frontend only
- `npm run backend:install` - Install backend dependencies
- `npm run frontend:install` - Install frontend dependencies

### Database Commands
- `npm run migration:run` - Run database migrations

## 📚 Documentation

### API Documentation
- **Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs) - Interactive API documentation (when backend is running)
- **OpenAPI Spec**: Available at `/api/docs-json` for client generation

### Guides
- [Webhook Quick Start](./WEBHOOK_QUICKSTART.md) - Quick guide to get webhooks running
- [Webhook Setup Guide](./docs/WEBHOOK_SETUP.md) - Detailed webhook configuration
- [Frontend Integration](./docs/FRONTEND_INTEGRATION.md) - Frontend setup and features
- [ChatBot Implementation](./docs/CHATBOT_IMPLEMENTATION.md) - Complete chatbot flow guide

## 🔧 Manual Setup

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Ngrok (for webhooks)
```bash
ngrok http 3000
```

## 🧪 Testing

Send a test message to your WhatsApp Business number and watch the logs:

```bash
npm run webhook:start
# Then send a WhatsApp message
# Check logs at logs/backend-*.log
```

## 🐛 Troubleshooting

See [WEBHOOK_QUICKSTART.md](./WEBHOOK_QUICKSTART.md#-sorun-giderme) for common issues and solutions.

## 📝 Requirements

- Node.js 18+
- PostgreSQL 14+
- ngrok (for webhook development)
- WhatsApp Business API credentials
- Google Gemini API key (optional, for AI-powered flow generation)

## 🛠️ Technology Stack

### Backend
- NestJS 11.0.1
- TypeScript 5.7
- TypeORM 0.3.27
- PostgreSQL 14+
- Socket.IO 4.8.1
- Axios 1.13.2

### Frontend
- React 19.2.0
- TypeScript 5.9
- ReactFlow (@xyflow/react) 12.3.5
- Dagre 0.8.5 (Auto Layout)
- Socket.IO Client 4.8.1
- Google Generative AI 1.30.0
- Vite 7.2.5

## 🔗 Resources

- [Swagger API Documentation](http://localhost:3000/api/docs) - Interactive API explorer
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [React Flow Documentation](https://reactflow.dev)
- [NestJS Documentation](https://nestjs.com)
- [Dagre Documentation](https://github.com/dagrejs/dagre/wiki)
- [Google Gemini API](https://ai.google.dev/)
