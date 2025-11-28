import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUrl,
  MaxLength,
  Min,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DataSourceType, AuthType } from '../../../entities/data-source.entity';

export class UpdateDataSourceDto {
  @ApiPropertyOptional({
    description: 'Name of the data source',
    example: 'Production Strapi CMS',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the data source',
    example: 'Production Strapi instance for product catalog',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of the data source',
    enum: DataSourceType,
    example: DataSourceType.STRAPI,
  })
  @IsOptional()
  @IsEnum(DataSourceType)
  type?: DataSourceType;

  @ApiPropertyOptional({
    description: 'Base URL of the data source',
    example: 'https://api.example.com',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'Base URL must be a valid URL' })
  @MaxLength(500)
  baseUrl?: string;

  @ApiPropertyOptional({
    description: 'Authentication type',
    enum: AuthType,
    example: AuthType.BEARER,
  })
  @IsOptional()
  @IsEnum(AuthType)
  authType?: AuthType;

  @ApiPropertyOptional({
    description: 'Authentication token (required for BEARER, API_KEY, BASIC auth types)',
    example: 'your-secret-token',
  })
  @IsOptional()
  @IsString()
  authToken?: string;

  @ApiPropertyOptional({
    description: 'Custom header name for authentication (used with API_KEY auth type)',
    example: 'X-API-Key',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  authHeaderName?: string;

  @ApiPropertyOptional({
    description: 'Additional HTTP headers as key-value pairs',
    example: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Additional configuration options specific to the data source type',
    example: { apiVersion: 'v1', timeout: 30000 },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether the data source is active and can be used',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Request timeout in milliseconds',
    example: 30000,
    minimum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000, { message: 'Timeout must be at least 1000ms' })
  timeout?: number;
}
