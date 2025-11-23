import { IsString, IsNotEmpty, IsEnum, IsObject, IsDate } from 'class-validator';
import { MessageType, MessageStatus } from '../../../entities/message.entity';

export class MessageReceivedDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsObject()
  content: any;

  @IsEnum(MessageStatus)
  status: MessageStatus;

  @IsDate()
  timestamp: Date;

  // Optional sender information
  sender?: {
    id: string;
    name: string;
    phoneNumber: string;
    avatar?: string;
  };
}
