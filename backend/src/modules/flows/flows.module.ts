import { Module } from '@nestjs/common';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';
import { FlowWebhookController } from './flow-webhook.controller';
import { AppointmentService } from './appointment.service';
import { MockCalendarService } from './mock-calendar.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  controllers: [FlowsController, FlowWebhookController],
  providers: [FlowsService, AppointmentService, MockCalendarService],
})
export class FlowsModule {}
