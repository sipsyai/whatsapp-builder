import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class TypingIndicatorDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsBoolean()
  isTyping: boolean;

  // Optional user information
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}
