import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatBotsController } from './chatbots.controller';
import { ChatBotsService } from './chatbots.service';
import { ChatBotWebhookController } from './chatbot-webhook.controller';
import { AppointmentService } from './appointment.service';
import { MockCalendarService } from './mock-calendar.service';
import { ChatBotExecutionService } from './services/chatbot-execution.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { ChatBot } from '../../entities/chatbot.entity';
import { ConversationContext } from '../../entities/conversation-context.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatBot, ConversationContext, Conversation, User]),
    WhatsAppModule,
  ],
  controllers: [ChatBotsController, ChatBotWebhookController],
  providers: [
    ChatBotsService,
    AppointmentService,
    MockCalendarService,
    ChatBotExecutionService,
  ],
  exports: [ChatBotExecutionService],
})
export class ChatBotsModule {}
