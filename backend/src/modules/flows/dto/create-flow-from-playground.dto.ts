import { IsString, IsArray, IsOptional, IsEnum, IsObject, IsBoolean, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WhatsAppFlowCategory } from '../../../entities/whatsapp-flow.entity';
import { ComponentDataSourceConfigDto } from './component-data-source-config.dto';

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

  @ApiPropertyOptional({
    description: 'Default Data Source UUID for the flow',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  dataSourceId?: string;

  @ApiPropertyOptional({
    description: 'Component-level data source configurations for dynamic dropdowns',
    type: [ComponentDataSourceConfigDto],
    example: [
      {
        componentName: 'selected_brand',
        dataSourceId: '550e8400-e29b-41d4-a716-446655440000',
        endpoint: '/api/brands',
        dataKey: 'data',
        transformTo: {
          idField: 'id',
          titleField: 'name',
          descriptionField: 'description'
        }
      }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentDataSourceConfigDto)
  dataSourceConfig?: ComponentDataSourceConfigDto[];
}
