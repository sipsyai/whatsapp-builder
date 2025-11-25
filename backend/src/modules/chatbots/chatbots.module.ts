import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatBotsController } from './chatbots.controller';
import { ChatBotsService } from './chatbots.service';
import { ChatBotWebhookController } from './chatbot-webhook.controller';
import { AppointmentService } from './appointment.service';
import { MockCalendarService } from './mock-calendar.service';
import { ProductCatalogService } from './product-catalog.service';
import { ChatBotExecutionService } from './services/chatbot-execution.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatBot } from '../../entities/chatbot.entity';
import { ConversationContext } from '../../entities/conversation-context.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';
import { WhatsAppFlow } from '../../entities/whatsapp-flow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatBot,
      ConversationContext,
      Conversation,
      User,
      WhatsAppFlow,
    ]),
    WhatsAppModule,
    MessagesModule,
  ],
  controllers: [ChatBotsController, ChatBotWebhookController],
  providers: [
    ChatBotsService,
    AppointmentService,
    MockCalendarService,
    ProductCatalogService,
    ChatBotExecutionService,
  ],
  exports: [ChatBotExecutionService],
})
export class ChatBotsModule {}
