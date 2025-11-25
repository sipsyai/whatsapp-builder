import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NodePositionDto {
  @ApiProperty({ description: 'X coordinate on canvas', example: 100 })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Y coordinate on canvas', example: 200 })
  @IsNumber()
  y: number;
}
