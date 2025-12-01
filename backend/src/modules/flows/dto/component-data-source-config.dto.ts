import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TransformToDto {
  @ApiProperty({ description: 'Field name for ID in API response', example: 'id' })
  @IsString()
  idField: string;

  @ApiProperty({ description: 'Field name for title in API response', example: 'name' })
  @IsString()
  titleField: string;

  @ApiPropertyOptional({ description: 'Field name for description', example: 'description' })
  @IsOptional()
  @IsString()
  descriptionField?: string;
}

export class ComponentDataSourceConfigDto {
  @ApiProperty({ description: 'Component name in Flow JSON', example: 'selected_brand' })
  @IsString()
  componentName: string;

  @ApiPropertyOptional({ description: 'Connection UUID (v2 - pre-configured connection)' })
  @IsOptional()
  @IsUUID()
  connectionId?: string;

  @ApiProperty({ description: 'Data Source UUID' })
  @IsUUID()
  dataSourceId: string;

  @ApiProperty({ description: 'API endpoint path', example: '/api/brands' })
  @IsString()
  endpoint: string;

  @ApiProperty({ description: 'Key to extract array from response', example: 'data' })
  @IsString()
  dataKey: string;

  @ApiProperty({ description: 'Transform configuration', type: TransformToDto })
  @IsObject()
  @ValidateNested()
  @Type(() => TransformToDto)
  transformTo: TransformToDto;

  @ApiPropertyOptional({ description: 'Depends on another field for cascading', example: 'selected_category' })
  @IsOptional()
  @IsString()
  dependsOn?: string;

  @ApiPropertyOptional({ description: 'Filter parameter name for cascading', example: 'filters[brand][id][$eq]' })
  @IsOptional()
  @IsString()
  filterParam?: string;
}
