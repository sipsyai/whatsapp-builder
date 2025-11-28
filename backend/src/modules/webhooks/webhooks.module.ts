import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { FlowEndpointController } from './flow-endpoint.controller';
import {
  WebhookSignatureService,
  WebhookParserService,
  WebhookProcessorService,
} from './services';
import { FlowEndpointService } from './services/flow-endpoint.service';
import { Message } from '../../entities/message.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';
import { WhatsAppConfig } from '../../entities/whatsapp-config.entity';
import { ConversationContext } from '../../entities/conversation-context.entity';
import { WhatsAppFlow } from '../../entities/whatsapp-flow.entity';
import { ChatBotsModule } from '../chatbots/chatbots.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { DataSourcesModule } from '../data-sources/data-sources.module';

/**
 * Webhooks Module
 * Handles incoming WhatsApp webhook requests, message parsing, and storage
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Message,
      Conversation,
      User,
      WhatsAppConfig,
      ConversationContext,
      WhatsAppFlow,
    ]),
    ChatBotsModule,
    WhatsAppModule,
    DataSourcesModule,
    forwardRef(() => WebSocketModule),
  ],
  controllers: [WebhooksController, FlowEndpointController],
  providers: [
    WebhookSignatureService,
    WebhookParserService,
    WebhookProcessorService,
    FlowEndpointService,
  ],
  exports: [
    WebhookSignatureService,
    WebhookParserService,
    WebhookProcessorService,
  ],
})
export class WebhooksModule {}
