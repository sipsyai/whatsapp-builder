import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class TestRestApiDto {
  @ApiProperty({ description: 'HTTP Method', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] })
  @IsString()
  method: string;

  @ApiProperty({ description: 'API URL' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Request headers' })
  @IsOptional()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Request body (JSON string)' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Test variables for {{variable}} replacement' })
  @IsOptional()
  testVariables?: Record<string, any>;

  @ApiPropertyOptional({ description: 'JSON path to extract' })
  @IsOptional()
  @IsString()
  responsePath?: string;

  @ApiPropertyOptional({ description: 'Request timeout in ms' })
  @IsOptional()
  timeout?: number;

  @ApiPropertyOptional({ description: 'Content type for request body' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Field name to filter array responses' })
  @IsOptional()
  @IsString()
  filterField?: string;

  @ApiPropertyOptional({ description: 'Value to filter by' })
  @IsOptional()
  @IsString()
  filterValue?: string;
}
