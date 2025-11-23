import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { FlowsModule } from './modules/flows/flows.module';

@Module({
  imports: [ConfigModule, WhatsAppModule, FlowsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
