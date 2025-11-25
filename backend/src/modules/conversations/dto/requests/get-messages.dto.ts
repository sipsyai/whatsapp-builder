import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for getting messages with pagination
 */
export class GetMessagesDto {
  @ApiPropertyOptional({
    description: 'Maximum number of messages to return',
    example: 50,
    minimum: 1,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Message ID to fetch messages before (for pagination)',
    example: 'msg_abc123',
  })
  @IsOptional()
  @IsString()
  before?: string;
}
