import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';
import { WhatsAppFlow } from '../../entities/whatsapp-flow.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsAppFlow]), WhatsAppModule],
  controllers: [FlowsController],
  providers: [FlowsService],
  exports: [FlowsService],
})
export class FlowsModule {}
