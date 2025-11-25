import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FlowMode {
  NAVIGATE = 'navigate',
  DATA_EXCHANGE = 'data_exchange',
}

export class SendFlowMessageDto {
  @ApiProperty({
    description: 'Recipient phone number in E.164 format',
    example: '+905321234567',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'WhatsApp Flow ID from Meta',
    example: '1234567890123456',
  })
  @IsString()
  @IsNotEmpty()
  flowId: string;

  @ApiProperty({
    description: 'Message body text displayed before the flow button',
    example: 'Book your appointment now!',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Call-to-action button text (max 20 characters)',
    example: 'Book Now',
  })
  @IsString()
  @IsNotEmpty()
  ctaText: string;

  @ApiPropertyOptional({
    description: 'Optional header text for the flow message',
    example: 'Appointment Booking',
  })
  @IsString()
  @IsOptional()
  header?: string;

  @ApiPropertyOptional({
    description: 'Optional footer text for the flow message',
    example: 'Takes only 2 minutes',
  })
  @IsString()
  @IsOptional()
  footer?: string;

  @ApiPropertyOptional({
    description: 'Unique token to track flow session',
    example: 'flow_session_abc123',
  })
  @IsString()
  @IsOptional()
  flowToken?: string;

  @ApiPropertyOptional({
    description: 'Flow execution mode',
    enum: FlowMode,
    example: FlowMode.DATA_EXCHANGE,
  })
  @IsEnum(FlowMode)
  @IsOptional()
  mode?: FlowMode;

  @ApiPropertyOptional({
    description: 'Initial screen ID to start the flow',
    example: 'WELCOME_SCREEN',
  })
  @IsString()
  @IsOptional()
  initialScreen?: string;

  @ApiPropertyOptional({
    description: 'Initial data to pass to the flow',
    example: { user_id: '123', name: 'John' },
  })
  @IsObject()
  @IsOptional()
  initialData?: Record<string, any>;
}
