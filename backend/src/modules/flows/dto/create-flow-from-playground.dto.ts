import { IsString, IsArray, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WhatsAppFlowCategory } from '../../../entities/whatsapp-flow.entity';

/**
 * DTO for creating a WhatsApp Flow from Playground JSON
 * Playground typically provides the complete flow JSON structure
 */
export class CreateFlowFromPlaygroundDto {
  @ApiProperty({
    description: 'Complete Flow JSON from Playground (includes version, screens, data_api_version, routing_model, etc.)',
    example: {
      version: '5.0',
      data_api_version: '3.0',
      routing_model: {},
      screens: [
        {
          id: 'WELCOME_SCREEN',
          title: 'Welcome',
          terminal: true,
          data: {},
          layout: {
            type: 'SingleColumnLayout',
            children: []
          }
        }
      ]
    }
  })
  @IsObject()
  playgroundJson: any; // Complete playground export JSON

  @ApiProperty({
    description: 'Name for the flow (if not provided, extracted from playgroundJson or auto-generated)',
    example: 'My Playground Flow',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the flow',
    example: 'Created from WhatsApp Flow Playground'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Categories for the flow',
    enum: WhatsAppFlowCategory,
    isArray: true,
    example: ['OTHER']
  })
  @IsArray()
  @IsEnum(WhatsAppFlowCategory, { each: true })
  categories: WhatsAppFlowCategory[];

  @ApiPropertyOptional({
    description: 'Custom endpoint URI for flow data exchange',
    example: 'https://api.example.com/flow-endpoint'
  })
  @IsOptional()
  @IsString()
  endpointUri?: string;

  @ApiPropertyOptional({
    description: 'Auto-publish after creation (default: false)',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  autoPublish?: boolean;
}
