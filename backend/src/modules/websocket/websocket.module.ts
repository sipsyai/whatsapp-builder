import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { WsAuthMiddleware } from './middleware/ws-auth.middleware';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [ConversationsModule, MessagesModule],
  providers: [MessagesGateway, WsAuthMiddleware],
  exports: [MessagesGateway],
})
export class WebSocketModule {}
