import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export class TestEndpointDto {
  @ApiProperty({
    description: 'Endpoint path to test (relative to base URL)',
    example: '/api/products',
  })
  @IsString()
  endpoint: string;

  @ApiPropertyOptional({
    description: 'HTTP method to use',
    enum: HttpMethod,
    default: HttpMethod.GET,
    example: HttpMethod.GET,
  })
  @IsOptional()
  @IsEnum(HttpMethod)
  method?: HttpMethod = HttpMethod.GET;

  @ApiPropertyOptional({
    description: 'Query parameters to include in the request',
    example: { page: 1, limit: 10 },
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Request body data (for POST, PUT, PATCH requests)',
    example: { name: 'Test Product', price: 99.99 },
  })
  @IsOptional()
  body?: any;
}
