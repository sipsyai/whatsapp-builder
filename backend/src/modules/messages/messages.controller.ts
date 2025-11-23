import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessageStatus } from '../../entities/message.entity';

@Controller('api/conversations/:conversationId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findByConversation(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.messagesService.findByConversation(
      conversationId,
      limit,
      before,
    );
  }

  @Post()
  create(
    @Param('conversationId') conversationId: string,
    @Body() messageData: any,
  ) {
    return this.messagesService.create({
      ...messageData,
      conversationId,
    });
  }

  @Post('read')
  markAsRead(@Param('conversationId') conversationId: string) {
    return this.messagesService.markConversationAsRead(conversationId);
  }
}
