import { IsString, IsArray, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WhatsAppFlowCategory } from '../../../entities/whatsapp-flow.entity';

export class UpdateFlowDto {
  @ApiPropertyOptional({ description: 'Name of the WhatsApp Flow', example: 'Updated Flow Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the flow', example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Categories for the flow',
    enum: WhatsAppFlowCategory,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(WhatsAppFlowCategory, { each: true })
  categories?: WhatsAppFlowCategory[];

  @ApiPropertyOptional({ description: 'Flow JSON structure defining screens and components' })
  @IsOptional()
  @IsObject()
  flowJson?: any;

  @ApiPropertyOptional({ description: 'Custom endpoint URI for flow data exchange' })
  @IsOptional()
  @IsString()
  endpointUri?: string;

  @ApiPropertyOptional({ description: 'Whether the flow is active locally', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata for the flow (integration configs, etc.)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
