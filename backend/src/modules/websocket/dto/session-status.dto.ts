import { IsString, IsNotEmpty, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class SessionStatusDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  previousStatus: string;

  @IsString()
  @IsNotEmpty()
  newStatus: string;

  @IsString()
  @IsNotEmpty()
  currentNodeId: string;

  @IsString()
  @IsOptional()
  currentNodeLabel?: string;

  @Type(() => Date)
  @IsDate()
  updatedAt: Date;
}
