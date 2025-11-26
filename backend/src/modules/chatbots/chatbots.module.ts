import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatBotsController } from './chatbots.controller';
import { ChatBotsService } from './chatbots.service';
import { ChatBotWebhookController } from './chatbot-webhook.controller';
import { SessionsController } from './sessions.controller';
import { AppointmentService } from './appointment.service';
import { MockCalendarService } from './mock-calendar.service';
import { ProductCatalogService } from './product-catalog.service';
import { ChatBotExecutionService } from './services/chatbot-execution.service';
import { ContextCleanupService } from './services/context-cleanup.service';
import { SessionHistoryService } from './services/session-history.service';
import { RestApiExecutorService } from './services/rest-api-executor.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { MessagesModule } from '../messages/messages.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { ChatBot } from '../../entities/chatbot.entity';
import { ConversationContext } from '../../entities/conversation-context.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';
import { WhatsAppFlow } from '../../entities/whatsapp-flow.entity';
import { Message } from '../../entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatBot,
      ConversationContext,
      Conversation,
      User,
      WhatsAppFlow,
      Message,
    ]),
    WhatsAppModule,
    MessagesModule,
    WebSocketModule,
  ],
  controllers: [ChatBotsController, ChatBotWebhookController, SessionsController],
  providers: [
    ChatBotsService,
    AppointmentService,
    MockCalendarService,
    ProductCatalogService,
    ChatBotExecutionService,
    ContextCleanupService,
    SessionHistoryService,
    RestApiExecutorService,
  ],
  exports: [ChatBotExecutionService, SessionHistoryService, RestApiExecutorService],
})
export class ChatBotsModule {}
