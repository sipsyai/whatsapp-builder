import { IsString, IsNotEmpty, IsDate, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class SessionCompletedDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @Type(() => Date)
  @IsDate()
  completedAt: Date;

  @IsString()
  @IsNotEmpty()
  completionReason: string;

  @IsNumber()
  @IsPositive()
  totalNodes: number;

  @IsNumber()
  @IsPositive()
  totalMessages: number;

  @IsNumber()
  @IsPositive()
  duration: number; // milliseconds
}
