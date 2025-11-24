import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppConfig } from '../../entities/whatsapp-config.entity';
import { WhatsAppApiService } from './services/whatsapp-api.service';
import { WhatsAppFlowService } from './services/whatsapp-flow.service';
import { WhatsAppMessageService } from './services/whatsapp-message.service';
import { WhatsAppConfigService } from './services/whatsapp-config.service';
import { FlowEncryptionService } from './services/flow-encryption.service';
import { FlowMessageService } from './services/message-types/flow-message.service';
import { TextMessageService } from './services/message-types/text-message.service';
import { InteractiveMessageService } from './services/message-types/interactive-message.service';
import { WhatsAppConfigController } from './whatsapp-config.controller';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([WhatsAppConfig])],
  controllers: [WhatsAppConfigController],
  providers: [
    WhatsAppApiService,
    WhatsAppFlowService,
    WhatsAppMessageService,
    WhatsAppConfigService,
    FlowEncryptionService,
    FlowMessageService,
    TextMessageService,
    InteractiveMessageService,
  ],
  exports: [
    WhatsAppApiService,
    WhatsAppFlowService,
    WhatsAppMessageService,
    WhatsAppConfigService,
    FlowEncryptionService,
    FlowMessageService,
    TextMessageService,
    InteractiveMessageService,
  ],
})
export class WhatsAppModule {}
