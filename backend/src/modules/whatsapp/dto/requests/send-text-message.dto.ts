import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendTextMessageDto {
  @ApiProperty({
    description: 'Recipient phone number in E.164 format',
    example: '+905321234567',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Text message content',
    example: 'Hello! How can I help you today?',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'Whether to show URL preview in message',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  previewUrl?: boolean;
}
