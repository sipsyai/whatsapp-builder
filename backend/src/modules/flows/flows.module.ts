import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';
import { FlowWebhookController } from './flow-webhook.controller';
import { AppointmentService } from './appointment.service';
import { MockCalendarService } from './mock-calendar.service';
import { FlowExecutionService } from './services/flow-execution.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { Flow } from '../../entities/flow.entity';
import { ConversationContext } from '../../entities/conversation-context.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Flow, ConversationContext, Conversation, User]),
    WhatsAppModule,
  ],
  controllers: [FlowsController, FlowWebhookController],
  providers: [
    FlowsService,
    AppointmentService,
    MockCalendarService,
    FlowExecutionService,
  ],
  exports: [FlowExecutionService],
})
export class FlowsModule {}
