# WhatsApp Builder

A powerful WhatsApp chatbot builder with visual flow designer and conversation management.

## 🌟 Features

- Visual flow builder with drag-and-drop interface (React Flow)
- WhatsApp Business API integration
- **WhatsApp Flows Management**
  - Create and manage WhatsApp Flows
  - Sync flows from Meta/Facebook API
  - Publish and preview flows
  - Use flows in ChatBot nodes
- Real-time conversation management
- Message and status tracking
- Webhook handling with ngrok support
- Flow-based conversational AI

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

- [Webhook Quick Start](./WEBHOOK_QUICKSTART.md) - Quick guide to get webhooks running
- [Webhook Setup Guide](./docs/WEBHOOK_SETUP.md) - Detailed webhook configuration
- [Frontend Integration](./docs/FRONTEND_INTEGRATION.md) - Frontend setup and features

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

## 🔗 Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [React Flow Documentation](https://reactflow.dev)
- [NestJS Documentation](https://nestjs.com)
