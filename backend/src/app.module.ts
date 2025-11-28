import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { ChatBotsModule } from './modules/chatbots/chatbots.module';
import { FlowsModule } from './modules/flows/flows.module';
import { MediaModule } from './modules/media/media.module';
import { UsersModule } from './modules/users/users.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { HealthModule } from './modules/health/health.module';
import { DataSourcesModule } from './modules/data-sources/data-sources.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    // Serve frontend static files in production
    // In Docker: __dirname = /app/dist/src, so we go up twice to get /app
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveStaticOptions: {
        index: ['index.html'],
      },
    }),
    AuthModule,
    WhatsAppModule,
    ChatBotsModule,
    FlowsModule,
    MediaModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    WebSocketModule,
    WebhooksModule,
    HealthModule,
    DataSourcesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT Auth Guard - all endpoints require auth by default
    // Use @Public() decorator to make endpoints public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
