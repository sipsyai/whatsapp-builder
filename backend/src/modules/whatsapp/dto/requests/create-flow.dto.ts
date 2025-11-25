import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsObject,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFlowDto {
  @ApiProperty({
    description: 'Name of the WhatsApp Flow',
    example: 'Appointment Booking Flow',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Array of flow categories',
    example: ['APPOINTMENT_BOOKING'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiProperty({
    description: 'Flow JSON structure defining screens and components',
    example: { version: '3.0', screens: [] },
  })
  @IsObject()
  @IsNotEmpty()
  flowJson: any;

  @ApiPropertyOptional({
    description: 'Custom endpoint URI for flow data exchange',
    example: 'https://api.example.com/flow-endpoint',
  })
  @IsString()
  @IsOptional()
  endpointUri?: string;
}
