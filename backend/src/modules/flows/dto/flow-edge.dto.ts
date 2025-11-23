import { IsString, IsOptional } from 'class-validator';

export class FlowEdgeDto {
  @IsString()
  source: string;

  @IsString()
  target: string;

  @IsOptional()
  @IsString()
  sourceHandle?: string;
}
