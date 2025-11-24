import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from '../../entities/message.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';
import { WebSocketModule } from '../websocket/websocket.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, User]),
    forwardRef(() => WebSocketModule),
    WhatsAppModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
