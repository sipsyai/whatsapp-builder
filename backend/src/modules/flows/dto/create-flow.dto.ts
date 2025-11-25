import { IsString, IsArray, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WhatsAppFlowCategory } from '../../../entities/whatsapp-flow.entity';

export class CreateFlowDto {
  @ApiProperty({ description: 'Name of the WhatsApp Flow', example: 'Appointment Booking Flow' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the flow', example: 'Allows users to book appointments' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Categories for the flow',
    enum: WhatsAppFlowCategory,
    isArray: true,
    example: ['APPOINTMENT_BOOKING']
  })
  @IsArray()
  @IsEnum(WhatsAppFlowCategory, { each: true })
  categories: WhatsAppFlowCategory[];

  @ApiProperty({
    description: 'Flow JSON structure defining screens and components',
    example: { version: '3.0', screens: [] }
  })
  @IsObject()
  flowJson: any;

  @ApiPropertyOptional({ description: 'Custom endpoint URI for flow data exchange', example: 'https://api.example.com/flow-endpoint' })
  @IsOptional()
  @IsString()
  endpointUri?: string;
}
