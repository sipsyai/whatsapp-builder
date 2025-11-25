import { Module, forwardRef } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { SessionGateway } from './session.gateway';
import { WsAuthMiddleware } from './middleware/ws-auth.middleware';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    forwardRef(() => ConversationsModule),
    forwardRef(() => MessagesModule),
  ],
  providers: [MessagesGateway, SessionGateway, WsAuthMiddleware],
  exports: [MessagesGateway, SessionGateway],
})
export class WebSocketModule {}
