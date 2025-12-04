import { Module, forwardRef } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { SessionGateway } from './session.gateway';
import { TestSessionGateway } from './test-session.gateway';
import { WsAuthMiddleware } from './middleware/ws-auth.middleware';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from '../auth/auth.module';
import { ChatbotTestingModule } from '../chatbot-testing/chatbot-testing.module';

@Module({
  imports: [
    forwardRef(() => ConversationsModule),
    forwardRef(() => MessagesModule),
    AuthModule,
    forwardRef(() => ChatbotTestingModule),
  ],
  providers: [MessagesGateway, SessionGateway, TestSessionGateway, WsAuthMiddleware],
  exports: [MessagesGateway, SessionGateway, TestSessionGateway],
})
export class WebSocketModule {}
