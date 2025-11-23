import { IsNumber } from 'class-validator';

export class NodePositionDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}
