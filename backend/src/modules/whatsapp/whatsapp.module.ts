import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppApiService } from './services/whatsapp-api.service';
import { WhatsAppFlowService } from './services/whatsapp-flow.service';
import { WhatsAppMessageService } from './services/whatsapp-message.service';
import { FlowMessageService } from './services/message-types/flow-message.service';
import { TextMessageService } from './services/message-types/text-message.service';

@Module({
  imports: [ConfigModule],
  providers: [
    WhatsAppApiService,
    WhatsAppFlowService,
    WhatsAppMessageService,
    FlowMessageService,
    TextMessageService,
  ],
  exports: [WhatsAppApiService, WhatsAppFlowService, WhatsAppMessageService],
})
export class WhatsAppModule {}
