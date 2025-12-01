import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ExportFlowQueryDto {
  @ApiPropertyOptional({
    description: 'Include metadata in export',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeMetadata?: boolean = true;
}

export interface ExportedFlowData {
  version: string;
  exportedAt: string;
  flow: {
    name: string;
    description?: string;
    status: string;
    categories: string[];
    flowJson: any;
    endpointUri?: string;
    isActive: boolean;
    metadata?: Record<string, any>;
  };
  dataSource?: {
    id: string;
    name: string;
    type: string;
  };
}

export class ExportFlowResponseDto implements ExportedFlowData {
  @ApiProperty({ example: '1.0' })
  version: string;

  @ApiProperty({ example: '2025-12-01T10:30:00.000Z' })
  exportedAt: string;

  @ApiProperty({
    description: 'Exported flow data',
    example: {
      name: 'My Flow',
      description: 'A sample flow',
      status: 'DRAFT',
      categories: ['APPOINTMENT_BOOKING'],
      flowJson: { version: '3.0', screens: [] },
      endpointUri: 'https://api.example.com/flow-endpoint',
      isActive: true,
      metadata: {},
    },
  })
  flow: {
    name: string;
    description?: string;
    status: string;
    categories: string[];
    flowJson: any;
    endpointUri?: string;
    isActive: boolean;
    metadata?: Record<string, any>;
  };

  @ApiPropertyOptional({
    description: 'Associated data source information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'My API',
      type: 'REST_API',
    },
  })
  dataSource?: {
    id: string;
    name: string;
    type: string;
  };
}
