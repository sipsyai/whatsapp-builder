import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ImportFlowBodyDto {
  @ApiPropertyOptional({
    description: 'Override flow name',
    example: 'My Imported Flow',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Create flow in Meta API (requires WhatsApp config)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  createInMeta?: boolean = false;
}

export class ImportFlowResponseDto {
  @ApiProperty({
    description: 'Whether the import was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Result message',
    example: 'Flow imported successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'ID of the imported flow',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  flowId?: string;

  @ApiPropertyOptional({
    description: 'Name of the imported flow',
    example: 'My Flow (Copy)',
  })
  flowName?: string;

  @ApiProperty({
    description: 'Timestamp of the import',
    example: '2025-12-01T10:30:00.000Z',
  })
  importedAt: string;

  @ApiPropertyOptional({
    description: 'Warnings encountered during import',
    type: [String],
    example: ['Data source not found, skipping association'],
  })
  warnings?: string[];

  @ApiPropertyOptional({
    description: 'WhatsApp Flow ID from Meta API',
    example: '123456789',
  })
  whatsappFlowId?: string;
}
