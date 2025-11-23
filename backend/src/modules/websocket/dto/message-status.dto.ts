import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { MessageStatus } from '../../../entities/message.entity';

export class MessageStatusDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsEnum(MessageStatus)
  status: MessageStatus;

  @IsString()
  @IsNotEmpty()
  updatedAt: string;
}
