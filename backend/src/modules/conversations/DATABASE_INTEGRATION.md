# Database Integration Guide

This guide explains how to integrate the Conversations module with the existing TypeORM database entities.

## Current Status

The Conversations module is currently using **in-memory storage** (Map objects) for development and testing. Database entities already exist in `src/entities/`:

- `Conversation` entity (`conversation.entity.ts`)
- `Message` entity (`message.entity.ts`)
- `User` entity (`user.entity.ts`)

## Database Entities Overview

### Conversation Entity

```typescript
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @Column({ nullable: true, length: 1000 })
  lastMessage: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastMessageAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
```

### Message Entity

```typescript
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  conversation: Conversation;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, (user) => user.sentMessages)
  sender: User;

  @Column({ type: 'enum', enum: MessageType })
  type: MessageType;

  @Column({ type: 'jsonb' })
  content: any;

  @Column({ type: 'enum', enum: MessageStatus })
  status: MessageStatus;

  @Column({ type: 'timestamp with time zone' })
  timestamp: Date;
}
```

## Integration Steps

### 1. Update Module Imports

Add TypeORM repositories to `conversations.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { Conversation } from '../../entities/conversation.entity';
import { Message } from '../../entities/message.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, User]),
    WhatsAppModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
```

### 2. Update Service with Repositories

Replace in-memory storage with TypeORM repositories in `conversations.service.ts`:

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../entities/conversation.entity';
import { Message } from '../../entities/message.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,

    @InjectRepository(Message)
    private messageRepository: Repository<Message>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly whatsAppMessageService: WhatsAppMessageService,
  ) {}

  // Update methods to use repositories instead of Map
}
```

### 3. Update Service Methods

#### Get Conversations

```typescript
async getConversations(): Promise<ConversationResponseDto[]> {
  this.logger.log('Fetching all conversations');

  const conversations = await this.conversationRepository.find({
    relations: ['participants', 'messages'],
    order: {
      lastMessageAt: 'DESC',
    },
  });

  return conversations.map((conv) => {
    // Map to DTO format
    return new ConversationResponseDto({
      id: conv.id,
      name: conv.participants[0]?.name || 'Unknown',
      avatar: conv.participants[0]?.avatar || '',
      lastMessage: conv.lastMessage || '',
      unreadCount: 0, // Calculate from messages
      timestamp: this.formatTimestamp(conv.lastMessageAt?.toISOString() || ''),
    });
  });
}
```

#### Get Messages

```typescript
async getMessages(
  conversationId: string,
  limit: number = 50,
  before?: string,
): Promise<MessagesListResponseDto> {
  this.logger.log(`Fetching messages for conversation ${conversationId}`);

  // Check if conversation exists
  const conversation = await this.conversationRepository.findOne({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundException(
      `Conversation with id ${conversationId} not found`,
    );
  }

  // Build query
  const queryBuilder = this.messageRepository
    .createQueryBuilder('message')
    .where('message.conversationId = :conversationId', { conversationId })
    .orderBy('message.timestamp', 'DESC');

  // Apply pagination
  if (before) {
    const beforeMessage = await this.messageRepository.findOne({
      where: { id: before },
    });
    if (beforeMessage) {
      queryBuilder.andWhere('message.timestamp < :beforeTimestamp', {
        beforeTimestamp: beforeMessage.timestamp,
      });
    }
  }

  const [messages, total] = await queryBuilder
    .take(limit + 1)
    .getManyAndCount();

  const hasMore = messages.length > limit;
  const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

  const messageDtos = paginatedMessages.map((msg) => {
    // Map to DTO format
    return new MessageResponseDto({
      id: msg.id,
      sender: msg.senderId === 'current-user-id' ? MessageSender.ME : MessageSender.THEM,
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      status: msg.status,
    });
  });

  return new MessagesListResponseDto(messageDtos, total, hasMore);
}
```

#### Send Message

```typescript
async sendMessage(
  conversationId: string,
  sendMessageDto: SendMessageDto,
): Promise<MessageResponseDto> {
  this.logger.log(`Sending message to conversation ${conversationId}`);

  // Check if conversation exists
  const conversation = await this.conversationRepository.findOne({
    where: { id: conversationId },
    relations: ['participants'],
  });

  if (!conversation) {
    throw new NotFoundException(
      `Conversation with id ${conversationId} not found`,
    );
  }

  // Create the message
  const message = this.messageRepository.create({
    conversationId,
    senderId: 'current-user-id', // Get from authentication context
    type: sendMessageDto.type,
    content: sendMessageDto.content,
    timestamp: new Date(),
    status: MessageStatus.SENT,
  });

  // Save to database
  const savedMessage = await this.messageRepository.save(message);

  // Update conversation's last message
  conversation.lastMessage = this.getLastMessagePreview(savedMessage);
  conversation.lastMessageAt = savedMessage.timestamp;
  await this.conversationRepository.save(conversation);

  // Send via WhatsApp API
  if (sendMessageDto.type === MessageType.TEXT) {
    try {
      const recipientPhone = this.getRecipientPhone(conversation);
      const whatsappDto: SendTextMessageDto = {
        to: recipientPhone,
        text: sendMessageDto.content as string,
      };

      await this.whatsAppMessageService.sendTextMessage(whatsappDto);

      // Update status
      savedMessage.status = MessageStatus.DELIVERED;
      await this.messageRepository.save(savedMessage);
    } catch (error) {
      this.logger.error(`Failed to send via WhatsApp: ${error.message}`);
    }
  }

  return new MessageResponseDto({
    id: savedMessage.id,
    sender: MessageSender.ME,
    type: savedMessage.type,
    content: savedMessage.content,
    timestamp: savedMessage.timestamp.toISOString(),
    status: savedMessage.status,
  });
}
```

#### Mark as Read

```typescript
async markAsRead(conversationId: string): Promise<{ success: boolean }> {
  this.logger.log(`Marking conversation ${conversationId} as read`);

  // Check if conversation exists
  const conversation = await this.conversationRepository.findOne({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundException(
      `Conversation with id ${conversationId} not found`,
    );
  }

  // Update all unread messages to read status
  await this.messageRepository
    .createQueryBuilder()
    .update(Message)
    .set({ status: MessageStatus.READ })
    .where('conversationId = :conversationId', { conversationId })
    .andWhere('status != :readStatus', { readStatus: MessageStatus.READ })
    .andWhere('senderId != :currentUserId', { currentUserId: 'current-user-id' })
    .execute();

  return { success: true };
}
```

### 4. Remove Mock Data

Remove the `initializeMockData()` method and its call from the constructor once database integration is complete.

### 5. Add Authentication Context

To properly identify the current user:

```typescript
// In controller, extract user from request
@Post(':id/messages')
async sendMessage(
  @Param('id') id: string,
  @Body() sendMessageDto: SendMessageDto,
  @Req() request: Request, // Add authentication
): Promise<MessageResponseDto> {
  const userId = request.user?.id; // From JWT or session
  return this.conversationsService.sendMessage(id, sendMessageDto, userId);
}
```

## Migration Steps

1. **Backup**: Ensure mock data is documented if needed for testing
2. **Test Database**: Verify database connection and entities are working
3. **Implement Repositories**: Update service methods one by one
4. **Test Each Method**: Ensure each endpoint works with database
5. **Remove Mock Data**: Clean up in-memory storage code
6. **Update Tests**: Update unit tests to use database mocks
7. **Documentation**: Update README with database usage

## Benefits of Database Integration

- **Persistence**: Messages survive server restarts
- **Scalability**: Handle large amounts of data
- **Relationships**: Proper foreign keys and data integrity
- **Querying**: Advanced filtering and searching
- **Performance**: Indexed queries for fast retrieval
- **Transactions**: ACID compliance for data consistency

## Additional Considerations

### Indexing

Add indexes for better performance:

```typescript
@Index(['conversationId', 'timestamp'])
@Entity('messages')
export class Message {
  // ...
}
```

### Soft Deletes

Consider using soft deletes for conversations:

```typescript
@DeleteDateColumn()
deletedAt?: Date;
```

### Pagination

For large message histories, implement cursor-based pagination:

```typescript
interface PaginationCursor {
  timestamp: Date;
  id: string;
}
```

### Caching

Consider adding Redis caching for frequently accessed data:

```typescript
@Injectable()
export class ConversationsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // ...
  ) {}
}
```

## Next Steps

1. Set up database connection in `database.module.ts`
2. Run migrations to create tables
3. Update `ConversationsModule` to import TypeORM
4. Replace service implementation with repository-based code
5. Test all endpoints with real database
6. Add authentication middleware
7. Implement user context for messages
