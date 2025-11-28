import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsObject,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HttpMethod } from '../../../entities/data-source-connection.entity';

export class TransformConfigDto {
  @ApiProperty({ description: 'Field name to use as the unique identifier' })
  @IsString()
  @IsNotEmpty()
  idField: string;

  @ApiProperty({ description: 'Field name to use as the display title' })
  @IsString()
  @IsNotEmpty()
  titleField: string;

  @ApiPropertyOptional({ description: 'Field name to use as the description' })
  @IsOptional()
  @IsString()
  descriptionField?: string;
}

export class CreateConnectionDto {
  @ApiProperty({ example: 'Get Products', description: 'Connection name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Connection description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '/api/products', description: 'API endpoint path' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  endpoint: string;

  @ApiPropertyOptional({
    enum: HttpMethod,
    default: HttpMethod.GET,
    description: 'HTTP method',
  })
  @IsOptional()
  @IsEnum(HttpMethod)
  method?: HttpMethod;

  @ApiPropertyOptional({ description: 'Default query parameters' })
  @IsOptional()
  @IsObject()
  defaultParams?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Default request body' })
  @IsOptional()
  defaultBody?: any;

  @ApiPropertyOptional({
    example: 'data',
    description: 'JSONPath key to extract data from response',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dataKey?: string;

  @ApiPropertyOptional({
    type: TransformConfigDto,
    description: 'Configuration for transforming response data',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TransformConfigDto)
  transformConfig?: TransformConfigDto;

  @ApiPropertyOptional({
    description: 'ID of the connection this depends on (for chained requests)',
  })
  @IsOptional()
  @IsUUID()
  dependsOnConnectionId?: string;

  @ApiPropertyOptional({
    example: { 'filters[brand][$eq]': '$.selectedBrand' },
    description: 'JSONPath mappings for parameter values from context data',
  })
  @IsOptional()
  @IsObject()
  paramMapping?: Record<string, string>;

  @ApiPropertyOptional({ default: true, description: 'Whether the connection is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
