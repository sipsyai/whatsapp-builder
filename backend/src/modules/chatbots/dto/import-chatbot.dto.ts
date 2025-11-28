import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Body DTO for import options (used with multipart form)
 */
export class ImportChatbotBodyDto {
  @ApiPropertyOptional({
    description: 'Override chatbot name (if not provided, uses name from JSON)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Set chatbot as active after import',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  setActive?: boolean = false;

  @ApiPropertyOptional({
    description: 'Import referenced WhatsApp Flows from export (if embedded)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  importFlows?: boolean = true;
}

/**
 * Response DTO for import endpoint
 */
export class ImportChatbotResponseDto {
  @ApiProperty({
    description: 'Whether the import was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Result message',
    example: 'Chatbot imported successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Created chatbot ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  chatbotId?: string;

  @ApiPropertyOptional({
    description: 'Final chatbot name (may be renamed if duplicate)',
    example: 'Customer Support Bot (Copy)',
  })
  chatbotName?: string;

  @ApiProperty({
    description: 'Import timestamp',
    example: '2025-11-28T10:30:00.000Z',
  })
  importedAt: string;

  @ApiPropertyOptional({
    description: 'Warnings during import (e.g., missing flows)',
    type: [String],
  })
  warnings?: string[];

  @ApiPropertyOptional({
    description: 'Imported WhatsApp Flow count',
    example: 2,
  })
  importedFlowsCount?: number;
}

/**
 * Validation result for import preview
 */
export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  chatbotName: string;
  nodeCount: number;
  edgeCount: number;
  referencedFlowIds: string[];
  embeddedFlowsCount: number;
}
