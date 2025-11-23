# Database Setup Guide

This guide explains how to set up PostgreSQL database for the WhatsApp Web Clone backend.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js and npm installed

## Database Configuration

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE whatsapp_builder;

# Create user (optional)
CREATE USER whatsapp_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE whatsapp_builder TO whatsapp_user;

# Exit PostgreSQL
\q
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and update the database credentials:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=whatsapp_builder
DB_SYNCHRONIZE=false
DB_LOGGING=true
```

**Important:** Never set `DB_SYNCHRONIZE=true` in production. Use migrations instead.

## Database Entities

The project includes the following entities:

### 1. User Entity
Stores user information including phone number, name, and avatar.

**Fields:**
- `id` (UUID, Primary Key)
- `phoneNumber` (string, unique)
- `name` (string)
- `avatar` (string, nullable)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### 2. Conversation Entity
Represents chat threads between users.

**Fields:**
- `id` (UUID, Primary Key)
- `participants` (Many-to-Many with User)
- `messages` (One-to-Many with Message)
- `lastMessage` (string, nullable)
- `lastMessageAt` (timestamp, nullable)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### 3. Message Entity
Stores individual messages within conversations.

**Fields:**
- `id` (UUID, Primary Key)
- `conversationId` (UUID, Foreign Key)
- `senderId` (UUID, Foreign Key)
- `type` (enum: text, image, video, document, audio, sticker, interactive)
- `content` (jsonb)
- `status` (enum: sent, delivered, read)
- `timestamp` (timestamp)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### 4. Flow Entity
Stores chatbot flows created in the React Flow builder.

**Fields:**
- `id` (UUID, Primary Key)
- `name` (string)
- `nodes` (jsonb array)
- `edges` (jsonb array)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Running Migrations

### Generate Migration

```bash
npm run typeorm migration:generate -- -n MigrationName
```

### Run Migrations

```bash
npm run typeorm migration:run
```

### Revert Migration

```bash
npm run typeorm migration:revert
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Conversations
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get conversation by ID
- `POST /api/conversations` - Create new conversation

### Messages
- `GET /api/conversations/:conversationId/messages` - Get messages in a conversation
- `POST /api/conversations/:conversationId/messages` - Send a message
- `POST /api/conversations/:conversationId/messages/read` - Mark conversation as read

### Flows
- `GET /flows` - Get all flows
- `GET /flows/:id` - Get flow by ID
- `POST /flows` - Create new flow
- `PUT /flows/:id` - Update flow
- `DELETE /flows/:id` - Delete flow

## Database Schema Design Principles

### 1. UUID Primary Keys
All entities use UUID for primary keys for better scalability and security.

### 2. Timestamps
All entities include `createdAt` and `updatedAt` timestamps using `@CreateDateColumn` and `@UpdateDateColumn`.

### 3. JSONB for Flexible Data
- Message `content` field uses JSONB to support different message types
- Flow `nodes` and `edges` use JSONB arrays for React Flow data

### 4. Proper Relationships
- **Many-to-Many**: Conversation ↔ User (participants)
- **One-to-Many**: Conversation → Message
- **Many-to-One**: Message → User (sender)

### 5. Cascade Deletes
Messages are cascade deleted when their conversation is deleted.

## Best Practices

1. **Never use synchronize in production** - Always use migrations
2. **Use transactions for complex operations** - Especially when creating related entities
3. **Index frequently queried fields** - Add indexes for phone numbers, conversation participants
4. **Use JSONB for flexible schemas** - Good for message content, flow data
5. **Always validate data** - Use DTOs with class-validator
6. **Handle errors properly** - Use NotFoundException, ConflictException appropriately

## Troubleshooting

### Connection Issues

If you can't connect to the database:

1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify credentials in `.env` file
3. Ensure PostgreSQL accepts connections from localhost
4. Check firewall settings

### Migration Issues

If migrations fail:

1. Check database connection
2. Ensure entities are properly imported
3. Verify TypeORM configuration
4. Check for conflicting migrations

## Production Considerations

1. **Use connection pooling** - Already configured in `database.config.ts`
2. **Enable query logging during development** - Set `DB_LOGGING=true`
3. **Backup database regularly** - Use pg_dump for PostgreSQL
4. **Use prepared statements** - TypeORM handles this automatically
5. **Monitor database performance** - Use PostgreSQL's built-in tools
6. **Set up read replicas** - For high-traffic applications

## TypeORM Resources

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
