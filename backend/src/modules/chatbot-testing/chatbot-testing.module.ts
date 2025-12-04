import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationContext } from '../../entities/conversation-context.entity';
import { ChatBot } from '../../entities/chatbot.entity';
import { User } from '../../entities/user.entity';
import { Conversation } from '../../entities/conversation.entity';
import { ChatbotTestingController } from './chatbot-testing.controller';
import { TestSessionService } from './services/test-session.service';
import { TestExecutionAdapterService } from './services/test-execution-adapter.service';
import { ChatBotsModule } from '../chatbots/chatbots.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationContext, ChatBot, User, Conversation]),
    forwardRef(() => ChatBotsModule),
    forwardRef(() => WebSocketModule),
  ],
  controllers: [ChatbotTestingController],
  providers: [TestSessionService, TestExecutionAdapterService],
  exports: [TestSessionService, TestExecutionAdapterService],
})
export class ChatbotTestingModule {}
