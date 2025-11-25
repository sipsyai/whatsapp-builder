import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatBotEdgeDto {
  @ApiProperty({ description: 'Source node ID', example: 'node_1' })
  @IsString()
  source: string;

  @ApiProperty({ description: 'Target node ID', example: 'node_2' })
  @IsString()
  target: string;

  @ApiPropertyOptional({ description: 'Source handle identifier for conditional branches (use "true" or "false" for condition nodes)', example: 'true' })
  @IsOptional()
  @IsString()
  sourceHandle?: string;
}
