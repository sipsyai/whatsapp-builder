import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateFlowDto {
  @ApiProperty({
    description: 'Flow JSON structure to validate',
    example: { version: '7.2', screens: [] }
  })
  @IsObject()
  flowJson: any;

  @ApiPropertyOptional({
    description: 'Optional flow ID to use for validation (updates existing draft instead of creating new)',
    example: 'uuid-here'
  })
  @IsOptional()
  @IsString()
  flowId?: string;

  @ApiPropertyOptional({
    description: 'Flow name (required if no flowId provided)',
    example: 'My Test Flow'
  })
  @IsOptional()
  @IsString()
  name?: string;
}
