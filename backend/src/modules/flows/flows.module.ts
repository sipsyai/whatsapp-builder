import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';
import { FlowWebhookController } from './flow-webhook.controller';
import { AppointmentService } from './appointment.service';
import { MockCalendarService } from './mock-calendar.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { Flow } from '../../entities/flow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Flow]), WhatsAppModule],
  controllers: [FlowsController, FlowWebhookController],
  providers: [FlowsService, AppointmentService, MockCalendarService],
})
export class FlowsModule {}
