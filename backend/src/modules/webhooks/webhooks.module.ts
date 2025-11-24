import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import {
  WebhookSignatureService,
  WebhookParserService,
  WebhookProcessorService,
} from './services';
import { Message } from '../../entities/message.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';
import { ChatBotsModule } from '../chatbots/chatbots.module';
import { WebSocketModule } from '../websocket/websocket.module';

/**
 * Webhooks Module
 * Handles incoming WhatsApp webhook requests, message parsing, and storage
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Message, Conversation, User]),
    ChatBotsModule,
    forwardRef(() => WebSocketModule),
  ],
  controllers: [WebhooksController],
  providers: [
    WebhookSignatureService,
    WebhookParserService,
    WebhookProcessorService,
  ],
  exports: [
    WebhookSignatureService,
    WebhookParserService,
    WebhookProcessorService,
  ],
})
export class WebhooksModule {}
