import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { ChatBotsModule } from './modules/chatbots/chatbots.module';
import { FlowsModule } from './modules/flows/flows.module';
import { MediaModule } from './modules/media/media.module';
import { UsersModule } from './modules/users/users.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WebSocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    WhatsAppModule,
    ChatBotsModule,
    FlowsModule,
    MediaModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    WebSocketModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
